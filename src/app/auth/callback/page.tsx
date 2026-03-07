"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        // implicit 방식에서는 Supabase 클라이언트가 URL hash의 토큰을 자동 처리함
        // onAuthStateChange로 세션 확인 후 리다이렉트
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session) {
                router.push("/feed");
            }
        });

        // 이미 세션이 있는 경우 (자동 처리 완료)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) router.push("/feed");
        });

        // 5초 내 세션 없으면 로그인 페이지로
        const timeout = setTimeout(() => router.push("/login?error=auth"), 5000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, [router]);

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
