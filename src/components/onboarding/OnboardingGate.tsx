"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useGameStore } from "@/store/useGameStore";
import OnboardingWizard from "./OnboardingWizard";
import { Loader2 } from "lucide-react";

// 인증 체크를 건너뛸 페이지 (홈, 로그인, 콜백, 교사 대시보드, 관리자)
const PUBLIC_PATHS = ["/login", "/auth/callback", "/teacher", "/admin"];

type Status = "loading" | "needs-onboarding" | "ready";

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<Status>("loading");
    // 초기 인증 체크 완료 여부를 추적 — 토큰 갱신 시 SIGNED_IN 재실행 방지
    const initializedRef = useRef(false);
    // 잔액 실시간 구독 채널 ref
    const balanceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const { updateProfile } = useGameStore();

    // "/" 는 정확히 일치, 나머지는 startsWith 로 체크 (startsWith("/")는 모든 경로에 매칭되므로 제외)
    const isPublicPath =
        pathname === "/" ||
        PUBLIC_PATHS.some(p => pathname?.startsWith(p));

    useEffect(() => {
        // 공개 페이지는 인증 체크 불필요
        // 단, 공개 페이지를 떠날 때(cleanup) initializedRef를 리셋해
        // 보호 페이지로 돌아오면 프로필을 다시 로드하도록 함
        if (isPublicPath) {
            setStatus("ready");
            return () => {
                initializedRef.current = false;
            };
        }

        // 이미 인증 완료된 경우 재체크 불필요 (페이지 이동 시 팝업 재출현 방지)
        if (initializedRef.current) return;

        const checkAuthAndProfile = async () => {
            // /admin 경로는 PUBLIC_PATHS로 이미 처리되므로
            // 여기서는 Supabase 세션만 확인 (admin 쿠키 체크 불필요)
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                // 이미 ready 상태라면 세션 일시 불가 상황 — 리다이렉트 하지 않음
                if (status !== "ready") router.push("/");
                return;
            }

            const { data: profile, error } = await supabase
                .from("profiles")
                .select("id, name, handle, avatar, marketer_type, team, points, rank, role, balance")
                .eq("id", session.user.id)
                .single();

            if (error || !profile) {
                // 이미 ready 상태인 사용자를 다시 온보딩으로 보내지 않음
                setStatus(prev => prev === "ready" ? "ready" : "needs-onboarding");
                return;
            }

            // balance가 null이면 game_state의 initial_balance를 기본값으로 사용
            let balance = profile.balance;
            if (balance === null || balance === undefined) {
                const { data: gs } = await supabase
                    .from("game_state")
                    .select("initial_balance")
                    .eq("id", 1)
                    .single();
                balance = gs?.initial_balance ?? 1000000;
            }

            updateProfile({
                name: profile.name,
                handle: profile.handle,
                avatar: profile.avatar,
                rank: profile.rank,
                team: profile.team,
                points: profile.points ?? 0,
                role: profile.role ?? "student",
            });
            useGameStore.setState({ balance });

            // 잔액 실시간 동기화: 관리자가 profiles.balance를 변경하면 즉시 반영
            // 기존 채널이 있으면 먼저 제거
            if (balanceChannelRef.current) {
                supabase.removeChannel(balanceChannelRef.current);
            }
            balanceChannelRef.current = supabase
                .channel(`profile-balance-${session.user.id}`)
                .on(
                    "postgres_changes",
                    {
                        event: "UPDATE",
                        schema: "public",
                        table: "profiles",
                        filter: `id=eq.${session.user.id}`,
                    },
                    (payload) => {
                        const newBalance = (payload.new as { balance?: number }).balance;
                        if (newBalance !== undefined) {
                            useGameStore.setState({ balance: newBalance });
                        }
                    }
                )
                .subscribe();

            initializedRef.current = true;
            setStatus("ready");
        };

        checkAuthAndProfile();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            // SIGNED_IN은 토큰 갱신 시에도 발생하므로, 이미 초기화된 경우 무시
            if (event === "SIGNED_IN" && !initializedRef.current) checkAuthAndProfile();
            if (event === "SIGNED_OUT") {
                initializedRef.current = false;
                if (balanceChannelRef.current) {
                    supabase.removeChannel(balanceChannelRef.current);
                    balanceChannelRef.current = null;
                }
                useGameStore.setState({
                    user: { name: "", handle: "", avatar: "", rank: "Beginner", team: "", points: 0, role: "", skillXP: { copywriting: 0, analytics: 0, creative: 0 } },
                    posts: [],
                    insights: [],
                    missions: [],
                    balance: 1000000,
                });
                router.push("/");
            }
        });

        return () => {
            subscription.unsubscribe();
            if (balanceChannelRef.current) {
                supabase.removeChannel(balanceChannelRef.current);
                balanceChannelRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPublicPath]);

    // 공개 페이지는 그대로 렌더링
    if (isPublicPath) return <>{children}</>;

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center"
                style={{ background: "var(--background)" }}>
                <Loader2 size={28} className="animate-spin" style={{ color: "var(--primary)" }} />
            </div>
        );
    }

    if (status === "needs-onboarding") {
        return <OnboardingWizard onComplete={() => setStatus("ready")} />;
    }

    return <>{children}</>;
}
