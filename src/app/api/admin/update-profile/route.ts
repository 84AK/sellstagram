import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin/token";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_FIELDS = ["team", "role", "is_leader"] as const;
type AllowedField = typeof ALLOWED_FIELDS[number];

export async function POST(request: NextRequest) {
    // 관리자 인증 확인
    const token = request.cookies.get("admin_token")?.value ?? "";
    if (!verifyAdminToken(token)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, field, value } = await request.json();

    if (!userId || !field || value === undefined) {
        return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    if (!ALLOWED_FIELDS.includes(field as AllowedField)) {
        return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    try {
        const supabaseAdmin = createAdminClient();
        const { error } = await supabaseAdmin
            .from("profiles")
            .update({ [field]: value })
            .eq("id", userId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
