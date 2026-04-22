import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

let vapidInitialized = false;
function initVapid() {
    if (vapidInitialized) return;
    const subject = process.env.VAPID_SUBJECT;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!subject || !publicKey || !privateKey) throw new Error("VAPID 환경변수 미설정");
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidInitialized = true;
}

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        initVapid();

        // 학생 세션 검증
        const token = req.headers.get("authorization")?.replace("Bearer ", "").trim();
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
        if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { itemName, itemIcon, userName } = await req.json();
        if (!itemName || !userName) {
            return NextResponse.json({ error: "itemName and userName required" }, { status: 400 });
        }

        // 교사·관리자 구독 조회: Supabase 계정 기반 OR 교사 대시보드에서 직접 구독한 기기
        const { data: teacherProfiles } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .in("role", ["teacher", "admin"]);

        const teacherIds = (teacherProfiles ?? []).map((p: { id: string }) => p.id);

        interface PushSub { endpoint: string; p256dh: string; auth: string; }

        // user_id 매핑된 교사 구독 + user_role='teacher'로 직접 등록된 구독 모두 수집
        const [subsById, subsByRole] = await Promise.all([
            teacherIds.length > 0
                ? supabaseAdmin.from("push_subscriptions").select("endpoint, p256dh, auth").in("user_id", teacherIds)
                : Promise.resolve({ data: [] as PushSub[] }),
            supabaseAdmin.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_role", "teacher"),
        ]);

        // endpoint 중복 제거
        const subMap = new Map<string, PushSub>();
        for (const sub of [...(subsById.data ?? []), ...(subsByRole.data ?? [])]) {
            if (sub) subMap.set((sub as PushSub).endpoint, sub as PushSub);
        }
        const subs = Array.from(subMap.values());

        if (!subs.length) return NextResponse.json({ ok: true, sent: 0 });

        const notification = JSON.stringify({
            title: "🎁 리워드 구매 요청",
            body: `${userName} 학생이 "${itemName}"을 구매했어요. 확인 후 지급해주세요!`,
            icon: "/icons/icon-192x192.png",
            url: "/teacher",
            tag: "reward-purchase",
        });

        const results = await Promise.allSettled(
            subs.map((sub) =>
                webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    notification
                ).catch(async (err) => {
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

        const sent = results.filter(r => r.status === "fulfilled").length;
        return NextResponse.json({ ok: true, sent, total: subs.length });
    } catch (err) {
        console.error("[push/reward-alert]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
