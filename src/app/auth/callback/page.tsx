"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Suspense } from "react";
import BrandLoader from "@/components/common/BrandLoader";

function AuthCallbackInner() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const code = searchParams.get("code");

        const processAuth = async () => {
            // 이미 세션이 있는지 먼저 확인 (OAuth 직후 race condition 방지)
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.push("/feed");
                return;
            }

            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code);
                if (error) {
                    // 에러가 나더라도 세션이 생성되었을 수 있으므로 다시 한번 확인
                    const { data: { session: retrySession } } = await supabase.auth.getSession();
                    if (retrySession) {
                        router.push("/feed");
                    } else {
                        router.push("/login?error=auth");
                    }
                } else {
                    router.push("/feed");
                }
                return;
            }

            router.push("/login?error=auth");
        };

        processAuth();
    }, [router, searchParams]);

    return <BrandLoader text="로그인 처리 중..." />;
}

export default function AuthCallback() {
    return (
        <Suspense fallback={<BrandLoader text="로그인 처리 중..." />}>
            <AuthCallbackInner />
        </Suspense>
    );
}
