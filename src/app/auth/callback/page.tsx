"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

function AuthCallbackInner() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const code = searchParams.get("code");

        if (code) {
            // PKCE: URL의 code 파라미터로 세션 교환
            supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
                if (error) {
                    router.push("/login?error=auth");
                } else {
                    router.push("/feed");
                }
            });
            return;
        }

        // fallback: 이미 세션이 있는 경우 (팀 로그인 등)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                router.push("/feed");
            } else {
                router.push("/login?error=auth");
            }
        });
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4"
            style={{ background: "var(--background)" }}>
            <Loader2 size={32} className="animate-spin" style={{ color: "var(--primary)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--foreground-soft)" }}>
                로그인 처리 중...
            </p>
        </div>
    );
}

export default function AuthCallback() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
                <Loader2 size={32} className="animate-spin" style={{ color: "var(--primary)" }} />
            </div>
        }>
            <AuthCallbackInner />
        </Suspense>
    );
}
