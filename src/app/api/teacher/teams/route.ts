import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function isAuthorized(request: NextRequest): boolean {
    const teacherCookie = request.cookies.get("teacher_auth")?.value;
    return teacherCookie === "true";
}

// GET: 전체 팀 목록 (공개)
export async function GET() {
    const admin = createAdminClient();
    const { data, error } = await admin
        .from("teams")
        .select("*")
        .order("created_at", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ teams: data ?? [] });
}

// POST: 팀 생성 (교사 전용)
export async function POST(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { name, emoji, color } = await request.json();
    if (!name?.trim()) {
        return NextResponse.json({ error: "팀 이름은 필수입니다" }, { status: 400 });
    }
    const admin = createAdminClient();
    const { data, error } = await admin
        .from("teams")
        .insert({ name: name.trim(), emoji: emoji ?? "🏆", color: color ?? "#FF6B35" })
        .select()
        .single();
    if (error) {
        if (error.code === "23505") {
            return NextResponse.json({ error: "이미 존재하는 팀 이름입니다" }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ team: data });
}

// DELETE: 팀 삭제 + 해당 팀 학생 미배정 처리 (교사 전용)
export async function DELETE(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const admin = createAdminClient();
    const { data: team } = await admin.from("teams").select("name").eq("id", id).single();
    if (team) {
        await admin.from("profiles").update({ team: null }).eq("team", team.name);
    }
    const { error } = await admin.from("teams").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
