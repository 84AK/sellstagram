import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_TEAMS = ["미배정", "A팀", "B팀", "C팀", "D팀", "E팀", "F팀"];

export async function POST(request: NextRequest) {
    // 교사 인증 쿠키 확인
    const teacherAuth = request.cookies.get("teacher_auth")?.value;
    if (teacherAuth !== "true") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId, team } = await request.json();

    if (!studentId || !team) {
        return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    if (!VALID_TEAMS.includes(team)) {
        return NextResponse.json({ error: "Invalid team" }, { status: 400 });
    }

    try {
        const supabaseAdmin = createAdminClient();
        const { error } = await supabaseAdmin
            .from("profiles")
            .update({ team })
            .eq("id", studentId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
