import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { verifyAdminToken } from "@/lib/admin/token";

// 빌드 타임이 아닌 요청 시점에 초기화 (env 미설정 시 빌드 에러 방지)
let vapidInitialized = false;
function initVapid() {
    if (vapidInitialized) return;
    const subject = process.env.VAPID_SUBJECT;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!subject || !publicKey || !privateKey) {
        throw new Error("VAPID 환경변수가 설정되지 않았습니다.");
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidInitialized = true;
}

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    url?: string;
    tag?: string;
    // 특정 유저 ID 배열 (없으면 전체 발송)
    targetUserIds?: string[];
    // 특정 팀 이름 (있으면 해당 팀만)
    targetTeam?: string;
}

export async function POST(req: NextRequest) {
    try {
        initVapid();
        // 교사/관리자 인증 — 두 가지 방법 지원
        // 방법 1: 관리자 쿠키 토큰 (admin_token)
        const adminCookie = req.cookies.get("admin_token")?.value ?? "";
        const isAdminCookie = verifyAdminToken(adminCookie);

        if (!isAdminCookie) {
            // 방법 2: Supabase Bearer JWT (교사 계정)
            const authHeader = req.headers.get("authorization");
            const token = authHeader?.replace("Bearer ", "").trim();
            if (!token) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const { data: { user: caller }, error: authErr } = await supabaseAdmin.auth.getUser(token);
            if (authErr || !caller) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const { data: profile } = await supabaseAdmin
                .from("profiles").select("role").eq("id", caller.id).single();
            if (profile?.role !== "teacher" && profile?.role !== "admin") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const payload: PushPayload = await req.json();

        if (!payload.title || !payload.body) {
            return NextResponse.json({ error: "title and body required" }, { status: 400 });
        }

        // 구독 목록 조회
        let query = supabaseAdmin.from("push_subscriptions").select("*");

        if (payload.targetUserIds?.length) {
            query = query.in("user_id", payload.targetUserIds);
        }

        const { data: subs, error } = await query;
        if (error) throw error;

        const notification = JSON.stringify({
            title: payload.title,
            body:  payload.body,
            icon:  payload.icon || "/icons/icon-192x192.png",
            url:   payload.url  || "/",
            tag:   payload.tag  || "sellstagram",
        });

        const results = await Promise.allSettled(
            (subs ?? []).map((sub) =>
                webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys:     { p256dh: sub.p256dh, auth: sub.auth },
                    },
                    notification
                ).catch(async (err) => {
                    // 만료된 구독 자동 삭제 (410 Gone)
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await supabaseAdmin
                            .from("push_subscriptions")
                            .delete()
                            .eq("endpoint", sub.endpoint);
                    }
                    throw err;
                })
            )
        );

        const sent   = results.filter(r => r.status === "fulfilled").length;
        const failed = results.filter(r => r.status === "rejected").length;

        // 알림 이력 저장 (수신함용)
        await supabaseAdmin.from("notifications").insert({
            title: payload.title,
            body:  payload.body,
            url:   payload.url || "/",
        }).then(({ error }) => { if (error) console.warn("[notifications insert]", error.message); });

        return NextResponse.json({ ok: true, sent, failed, total: subs?.length ?? 0 });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[push/send]", msg);
        // 내부 메시지는 서버 로그에만, 클라이언트에는 일반화된 메시지 반환
        const clientMsg = process.env.NODE_ENV === "development" ? msg : "푸시 알림 발송 중 오류가 발생했습니다.";
        return NextResponse.json({ error: clientMsg }, { status: 500 });
    }
}
