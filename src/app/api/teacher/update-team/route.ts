import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_TEAMS = ["미배정", "A팀", "B팀", "C팀", "D팀", "E팀", "F팀"];

export async function POST(request: NextRequest) {
    const { studentId, team } = await request.json();

    if (!studentId || !team) {
        return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }
    if (!VALID_TEAMS.includes(team)) {
        return NextResponse.json({ error: "Invalid team" }, { status: 400 });
    }

    // 인증 방법 1: Supabase 세션 토큰 (Authorization 헤더)
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    // 인증 방법 2: teacher_auth 쿠키 (PIN 재로그인 후)
    const teacherCookie = request.cookies.get("teacher_auth")?.value;

    if (!token && teacherCookie !== "true") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 토큰이 있으면 Supabase로 신원 확인 + teacher 역할 검증
    if (token) {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
        if (profile?.role !== "teacher") {
            return NextResponse.json({ error: "Not a teacher" }, { status: 403 });
        }
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
