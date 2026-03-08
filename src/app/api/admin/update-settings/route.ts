import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
    // 관리자 쿠키 확인
    const adminAuth = request.cookies.get("admin_auth")?.value;
    if (adminAuth !== "true") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { field, value } = await request.json();

    // 허용된 필드만 업데이트
    const ALLOWED_FIELDS = ["unlocked_weeks"];
    if (!field || !ALLOWED_FIELDS.includes(field)) {
        return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    try {
        const supabaseAdmin = createAdminClient();
        const { error } = await supabaseAdmin
            .from("app_settings")
            .update({ [field]: value, updated_at: new Date().toISOString() })
            .eq("id", 1);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
