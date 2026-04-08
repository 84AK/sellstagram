"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useGameStore } from "@/store/useGameStore";
import OnboardingWizard from "./OnboardingWizard";
import BrandLoader from "@/components/common/BrandLoader";

// 인증 체크를 건너뛸 페이지 (홈, 로그인, 콜백, 교사 대시보드, 관리자, 게시물 공유)
const PUBLIC_PATHS = ["/login", "/auth/callback", "/teacher", "/admin", "/post/", "/ab-test/", "/install"];

type Status = "loading" | "needs-onboarding" | "ready";

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<Status>("loading");
    // stale closure 방지: useEffect 내 async 함수에서 status를 읽을 때 최신값 보장
    const statusRef = useRef<Status>("loading");
    const setStatusSafe = (s: Status) => { statusRef.current = s; setStatus(s); };
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
            setStatusSafe("ready");
            return () => {
                // 공개 경로를 벗어날 때 상태 초기화 — 신규 유저가 보호 경로 진입 시
                // 온보딩 체크가 다시 실행되도록 함 (역할 선택 팝업 미표시 버그 수정)
                initializedRef.current = false;
                setStatusSafe("loading");
            };
        }

        // 이미 인증 완료된 경우 재체크 불필요 (페이지 이동 시 팝업 재출현 방지)
        if (initializedRef.current) return;

        const checkAuthAndProfile = async () => {
            // /admin 경로는 PUBLIC_PATHS로 이미 처리되므로
            // 여기서는 Supabase 세션만 확인 (admin 쿠키 체크 불필요)
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                // statusRef로 최신 상태 읽기 (stale closure 방지)
                if (statusRef.current !== "ready") router.push("/");
                return;
            }

            const { data: profile, error } = await supabase
                .from("profiles")
                .select("id, name, handle, avatar, marketer_type, team, points, rank, role, balance, skill_xp")
                .eq("id", session.user.id)
                .maybeSingle(); // .single() 대신 .maybeSingle() 사용하여 결과 없을 때 에러 방지

            if (error) {
                console.error("Profile fetch error:", error);
                // 네트워크 오류 등으로 인한 실패 시 온보딩으로 보내지 않고 대기
                // 또는 에러 상태를 보여주는 것이 안전함
                return;
            }

            // 프로필이 없거나 이름이 미설정된 신규 유저만 온보딩 필요
            const isNewUser = !profile || !profile.name?.trim();
            if (isNewUser) {
                setStatusSafe("needs-onboarding");
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
                balance = gs?.initial_balance ?? 500000;
            }

            const savedSkillXP = profile.skill_xp as { copywriting?: number; analytics?: number; creative?: number } | null;
            updateProfile({
                name: profile.name,
                handle: profile.handle,
                avatar: profile.avatar,
                rank: profile.rank,
                team: profile.team,
                points: profile.points ?? 0,
                role: profile.role ?? "student",
                marketerType: profile.marketer_type ?? undefined,
                skillXP: {
                    copywriting: savedSkillXP?.copywriting ?? 0,
                    analytics: savedSkillXP?.analytics ?? 0,
                    creative: savedSkillXP?.creative ?? 0,
                },
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
            setStatusSafe("ready");
        };

        // onAuthStateChange의 INITIAL_SESSION을 통해 초기 인증 체크
        // (getSession() 직접 호출 시 OAuth 직후 race condition 발생 가능)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            // INITIAL_SESSION: 구독 등록 시 현재 세션 상태를 즉시 알려줌 (신뢰성 높음)
            // SIGNED_IN: OAuth 콜백 직후 세션 확립 시 발생
            if ((event === "INITIAL_SESSION" || event === "SIGNED_IN") && !initializedRef.current) checkAuthAndProfile();
            if (event === "SIGNED_OUT") {
                // iOS/iPad Chrome에서 토큰 갱신 중 spurious SIGNED_OUT이 발생할 수 있으므로
                // 세션을 한 번 더 확인 후 실제로 로그아웃된 경우에만 처리
                supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
                    if (currentSession) return; // 세션 복구됨 — 무시
                    initializedRef.current = false;
                    if (balanceChannelRef.current) {
                        supabase.removeChannel(balanceChannelRef.current);
                        balanceChannelRef.current = null;
                    }
                    useGameStore.setState({
                        user: { name: "", handle: "", avatar: "", rank: "Beginner", team: "", points: 0, role: "", skillXP: { copywriting: 0, analytics: 0, creative: 0 }, selectedCharId: "", activeSkin: "default" },
                        posts: [],
                        insights: [],
                        missions: [],
                        balance: 500000,
                    });
                    router.push("/login");
                });
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
        return <BrandLoader text="프로필 정보를 확인하고 있어요..." />;
    }

    if (status === "needs-onboarding") {
        return <OnboardingWizard onComplete={() => setStatus("ready")} />;
    }

    return <>{children}</>;
}
