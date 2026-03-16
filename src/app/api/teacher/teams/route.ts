import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminToken } from "@/lib/admin/token";

async function isAuthorized(request: NextRequest): Promise<boolean> {
    // 방법 1: teacher_auth 쿠키 (PIN 인증 후)
    if (request.cookies.get("teacher_auth")?.value === "true") return true;

    // 방법 2: admin_token 쿠키 (관리자)
    const adminToken = request.cookies.get("admin_token")?.value ?? "";
    if (verifyAdminToken(adminToken)) return true;

    // 방법 3: Supabase Bearer 토큰 + teacher role
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (token) {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();
            if (profile?.role === "teacher") return true;
        }
    }

    return false;
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

/** 혼동 없는 문자 6자리 입장 코드 생성 */
function generateJoinCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// POST: 팀 생성 (교사 전용)
export async function POST(request: NextRequest) {
    if (!(await isAuthorized(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { name, emoji, color } = await request.json();
    if (!name?.trim()) {
        return NextResponse.json({ error: "팀 이름은 필수입니다" }, { status: 400 });
    }
    const admin = createAdminClient();

    // 코드 충돌 방지: 최대 3회 시도
    let data = null, error = null;
    for (let attempt = 0; attempt < 3; attempt++) {
        const joinCode = generateJoinCode();
        const result = await admin
            .from("teams")
            .insert({ name: name.trim(), emoji: emoji ?? "🏆", color: color ?? "#FF6B35", join_code: joinCode })
            .select()
            .single();
        data = result.data; error = result.error;
        if (!error || error.code !== "23505" || !error.message.includes("join_code")) break;
    }
    if (error) {
        if (error.code === "23505") {
            return NextResponse.json({ error: "이미 존재하는 팀 이름입니다" }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ team: data });
}

// PATCH: 팀 코드 재생성 또는 팀 정보(이름/이모지/색상) 수정 (교사 전용)
export async function PATCH(request: NextRequest) {
    if (!(await isAuthorized(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { id, name, emoji, color } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const admin = createAdminClient();

    // 이름/이모지/색상 업데이트 모드
    if (name !== undefined) {
        if (!name.trim()) return NextResponse.json({ error: "팀 이름은 필수입니다" }, { status: 400 });

        // 기존 팀 이름 조회 (profiles.team 동기화용)
        const { data: existing } = await admin.from("teams").select("name").eq("id", id).single();

        const updates: Record<string, string> = { name: name.trim() };
        if (emoji !== undefined) updates.emoji = emoji;
        if (color !== undefined) updates.color = color;

        const { data, error } = await admin
            .from("teams")
            .update(updates)
            .eq("id", id)
            .select()
            .single();
        if (error) {
            if (error.code === "23505") return NextResponse.json({ error: "이미 존재하는 팀 이름입니다" }, { status: 409 });
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 팀 이름이 바뀌었으면 해당 학생들의 team 컬럼도 업데이트
        if (existing && existing.name !== name.trim()) {
            await admin.from("profiles").update({ team: name.trim() }).eq("team", existing.name);
        }

        return NextResponse.json({ team: data });
    }

    // 기본 모드: 코드 재생성
    const { data, error } = await admin
        .from("teams")
        .update({ join_code: generateJoinCode() })
        .eq("id", id)
        .select()
        .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ team: data });
}

// DELETE: 팀 삭제 + 해당 팀 학생 미배정 처리 (교사 전용)
export async function DELETE(request: NextRequest) {
    if (!(await isAuthorized(request))) {
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
