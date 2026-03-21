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

        if (code) {
            supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
                if (error) {
                    router.push("/login?error=auth");
                } else {
                    router.push("/feed");
                }
            });
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                router.push("/feed");
            } else {
                router.push("/login?error=auth");
            }
        });
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
