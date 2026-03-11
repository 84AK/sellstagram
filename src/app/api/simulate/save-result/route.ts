import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string | null = null;

    if (token) {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id ?? null;
    }

    const body = await request.json();
    const {
        user_name, user_handle, post_id, post_caption, post_image,
        session_started_at, duration_minutes,
        total_likes, total_comments, total_shares, total_purchases, total_revenue,
        events,
    } = body;

    if (!post_id || !session_started_at) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 결과 저장
    const { data, error } = await admin.from("simulation_results").insert({
        user_id: userId,
        user_name, user_handle, post_id, post_caption, post_image,
        session_started_at, duration_minutes,
        total_likes, total_comments, total_shares, total_purchases, total_revenue,
        events,
    }).select().single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 매출이 있고 userId가 있으면 profiles.balance + points 증가
    if (userId && total_revenue > 0) {
        const { data: profile } = await admin
            .from("profiles")
            .select("balance, points")
            .eq("id", userId)
            .single();

        const currentBalance = profile?.balance ?? 0;
        const currentPoints = profile?.points ?? 0;
        // 매출 ₩1,000 당 1pt 지급 (최소 10pt)
        const earnedPoints = Math.max(10, Math.floor(total_revenue / 1000));

        await admin
            .from("profiles")
            .update({
                balance: currentBalance + total_revenue,
                points: currentPoints + earnedPoints,
            })
            .eq("id", userId);
    }

    return NextResponse.json({ ok: true, id: data?.id });
}
