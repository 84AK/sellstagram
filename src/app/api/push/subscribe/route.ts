import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminToken } from "@/lib/admin/token";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { subscription, userId, userName } = await req.json();

        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
        }

        // userRole은 클라이언트 요청을 신뢰하지 않고 서버에서 직접 결정
        let resolvedRole: string | null = null;

        // 1) admin_token 쿠키 → 교사 대시보드 PIN 인증
        const adminCookie = req.cookies.get("admin_token")?.value ?? "";
        if (verifyAdminToken(adminCookie)) {
            resolvedRole = "teacher";
        } else {
            // 2) Supabase Bearer 토큰 → 교사/관리자 계정 확인
            const token = req.headers.get("authorization")?.replace("Bearer ", "").trim();
            if (token) {
                const { data: { user } } = await supabaseAdmin.auth.getUser(token);
                if (user) {
                    const { data: profile } = await supabaseAdmin
                        .from("profiles")
                        .select("role")
                        .eq("id", user.id)
                        .single();
                    if (profile?.role === "teacher" || profile?.role === "admin") {
                        resolvedRole = "teacher";
                    }
                }
            }
        }

        const { error } = await supabaseAdmin
            .from("push_subscriptions")
            .upsert({
                endpoint:  subscription.endpoint,
                p256dh:    subscription.keys.p256dh,
                auth:      subscription.keys.auth,
                user_id:   userId   || null,
                user_name: userName || null,
                user_role: resolvedRole,
                updated_at: new Date().toISOString(),
            }, { onConflict: "endpoint" });

        if (error) throw error;

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[push/subscribe]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { endpoint } = await req.json();
        if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });

        await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", endpoint);
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[push/unsubscribe]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
