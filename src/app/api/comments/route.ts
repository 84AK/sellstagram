import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/comments?postId=xxx — RLS 우회, 비로그인도 댓글 조회 가능
export async function GET(request: NextRequest) {
    const postId = request.nextUrl.searchParams.get("postId");
    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
        .from("comments")
        .select("id, user_name, text, created_at")
        .eq("post_id", postId)
        .eq("is_ai_reaction", false)
        .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: data ?? [] });
}

// POST /api/comments — RLS 우회, 비로그인도 댓글 저장 가능
export async function POST(request: NextRequest) {
    const body = await request.json();
    const { post_id, user_name, user_handle, text } = body;

    if (!post_id || !text?.trim()) {
        return NextResponse.json({ error: "post_id and text required" }, { status: 400 });
    }

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
        .from("comments")
        .insert({
            post_id,
            user_name: user_name?.trim() || "익명",
            user_handle: user_handle || "guest",
            text: text.trim(),
            is_ai_reaction: false,
        })
        .select("id, user_name, text, created_at")
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
}
