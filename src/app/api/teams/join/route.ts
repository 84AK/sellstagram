import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/teams/join?code=ABC123  — 학생이 팀 코드를 입력해 팀 정보를 조회
export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code")?.toUpperCase().trim();
    if (!code) return NextResponse.json({ error: "코드를 입력해주세요" }, { status: 400 });

    const admin = createAdminClient();
    const { data, error } = await admin
        .from("teams")
        .select("id, name, emoji, color, join_code")
        .eq("join_code", code)
        .single();

    if (error || !data) {
        return NextResponse.json({ error: "유효하지 않은 팀 코드예요" }, { status: 404 });
    }
    return NextResponse.json({ team: data });
}
