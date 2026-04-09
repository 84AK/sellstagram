import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin/token";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
    const token = request.cookies.get("admin_token")?.value ?? "";
    if (!verifyAdminToken(token)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await request.json();
    if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });

    try {
        const supabaseAdmin = createAdminClient();
        const { error } = await supabaseAdmin.from("posts").delete().eq("id", postId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
