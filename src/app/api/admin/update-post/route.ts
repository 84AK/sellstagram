import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin/token";
import { createAdminClient } from "@/lib/supabase/admin";

// 관리자가 수정 가능한 필드 제한 (보안)
const ALLOWED_FIELDS = ["caption", "tags", "source"] as const;
type AllowedField = typeof ALLOWED_FIELDS[number];

export async function POST(request: NextRequest) {
    const token = request.cookies.get("admin_token")?.value ?? "";
    if (!verifyAdminToken(token)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId, field, value } = await request.json();

    if (!postId || !field || value === undefined) {
        return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    if (!ALLOWED_FIELDS.includes(field as AllowedField)) {
        return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    // 필드별 값 타입 검증
    if (field === "source" && !["simulation", "channel"].includes(value)) {
        return NextResponse.json({ error: "Invalid value for source" }, { status: 400 });
    }
    if ((field === "caption" || field === "tags") && typeof value !== "string") {
        return NextResponse.json({ error: "Invalid value type" }, { status: 400 });
    }

    try {
        const supabaseAdmin = createAdminClient();
        const { error } = await supabaseAdmin
            .from("posts")
            .update({ [field]: value })
            .eq("id", postId);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
