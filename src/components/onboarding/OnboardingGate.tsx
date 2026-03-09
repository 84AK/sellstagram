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
    const router = useRouter();
    const pathname = usePathname();
    const { updateProfile } = useGameStore();

    // "/" 는 정확히 일치, 나머지는 startsWith 로 체크 (startsWith("/")는 모든 경로에 매칭되므로 제외)
    const isPublicPath =
        pathname === "/" ||
        PUBLIC_PATHS.some(p => pathname?.startsWith(p));

    useEffect(() => {
        // 공개 페이지는 인증 체크 불필요
        if (isPublicPath) {
            setStatus("ready");
            return;
        }

        initializedRef.current = false;

        const checkAuthAndProfile = async () => {
            // 관리자 쿠키 확인 — 관리자는 모든 페이지 자유 접근
            const adminRes = await fetch("/api/auth/admin-check");
            const { isAdmin } = await adminRes.json();
            if (isAdmin) {
                initializedRef.current = true;
                setStatus("ready");
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push("/");
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("id, name, handle, avatar, marketer_type, team, points, rank, role, balance")
                .eq("id", session.user.id)
                .single();

            if (!profile) {
                setStatus("needs-onboarding");
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
                avatar: profile.avatar, // DiceBear URL or emoji — AvatarDisplay가 자동 처리
                rank: profile.rank,
                team: profile.team,
                points: profile.points ?? 0,
                role: profile.role ?? "student",
            });
            useGameStore.setState({ balance });

            initializedRef.current = true;
            setStatus("ready");
        };

        checkAuthAndProfile();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            // SIGNED_IN은 토큰 갱신 시에도 발생하므로, 이미 초기화된 경우 무시
            if (event === "SIGNED_IN" && !initializedRef.current) checkAuthAndProfile();
            if (event === "SIGNED_OUT") {
                // 스토어 유저 정보 초기화
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

        return () => subscription.unsubscribe();
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
