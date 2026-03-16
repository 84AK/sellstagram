import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";

const BADGE_MAP: Record<string, string> = {
    creator: "🎨 콘텐츠 창작자",
    analyst: "📊 데이터 전략가",
    storyteller: "✍️ 브랜드 스토리텔러",
    innovator: "💡 트렌드 개척자",
};

/**
 * 이름 + 팀 코드로 결정적(deterministic) 이메일/비밀번호 생성
 * 실제 이메일이 아닌 내부 식별자로만 사용
 */
function makeCredentials(name: string, teamCode: string) {
    const secret = process.env.TEAM_LOGIN_SECRET ?? "sellstagram_internal_2025";

    // 이름+팀코드 해시 → 이메일 (충돌 최소화)
    let h1 = 5381;
    const s1 = name.trim().toLowerCase() + teamCode.toUpperCase();
    for (let i = 0; i < s1.length; i++) {
        h1 = (Math.imul(h1, 33) ^ s1.charCodeAt(i)) >>> 0;
    }

    // 팀코드+시크릿 해시 → 비밀번호
    let h2 = 5381;
    const s2 = teamCode.toUpperCase() + secret;
    for (let i = 0; i < s2.length; i++) {
        h2 = (Math.imul(h2, 33) ^ s2.charCodeAt(i)) >>> 0;
    }

    return {
        email: `tc_${h1.toString(36)}@sellstagram.app`,
        password: `SGS_${h2.toString(36)}_${teamCode.toUpperCase()}`,
    };
}

/**
 * POST /api/auth/team-login
 *
 * 1단계 (이름+팀코드만): 기존 유저 여부 확인
 *   body: { name, teamCode }
 *   response: { isNewUser: true, team } | { session }
 *
 * 2단계 (신규 가입): 마케터 타입 + 아바타 포함
 *   body: { name, teamCode, type, avatar }
 *   response: { session }
 */
export async function POST(req: NextRequest) {
    const body = await req.json();
    const { name, teamCode, type, avatar } = body as {
        name: string;
        teamCode: string;
        type?: string;
        avatar?: string;
    };

    if (!name?.trim() || !teamCode?.trim()) {
        return NextResponse.json({ error: "이름과 팀 코드를 입력해주세요" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. 팀 코드 검증
    const { data: team, error: teamError } = await admin
        .from("teams")
        .select("id, name, emoji, color")
        .eq("join_code", teamCode.toUpperCase().trim())
        .single();

    if (teamError || !team) {
        return NextResponse.json({ error: "유효하지 않은 팀 코드예요" }, { status: 400 });
    }

    // 2. 해당 팀에 같은 이름의 프로필 있는지 확인 (기존 유저 체크)
    const { data: existingProfile } = await admin
        .from("profiles")
        .select("id, name, avatar, marketer_type, rank, role")
        .eq("name", name.trim())
        .eq("team", team.name)
        .single();

    const { email, password } = makeCredentials(name, teamCode);

    if (existingProfile) {
        // ── 기존 유저: 재로그인 ──
        // 익명(anonymous) 유저였다면 email/password 인증 추가
        const { data: authData } = await admin.auth.admin.getUserById(existingProfile.id);
        if (authData?.user && !authData.user.email) {
            await admin.auth.admin.updateUserById(existingProfile.id, {
                email,
                password,
                email_confirm: true,
            });
        }

        // 로그인 (anon key 클라이언트로 호출해야 정상 JWT 발급)
        const anonClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );
        const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({ email, password });
        if (signInError) {
            return NextResponse.json({ error: "로그인 실패. 선생님께 문의해주세요." }, { status: 400 });
        }
        return NextResponse.json({ session: signInData.session });
    }

    // ── 신규 유저 ──
    // type 없으면 → 프론트에 신규 가입 폼 표시 요청
    if (!type) {
        return NextResponse.json({ isNewUser: true, team }, { status: 200 });
    }

    // 이름 전체 중복 체크 (팀 무관)
    const { data: dupCheck } = await admin
        .from("profiles")
        .select("id")
        .eq("name", name.trim())
        .limit(1);

    if ((dupCheck?.length ?? 0) > 0) {
        return NextResponse.json({ error: "이미 사용 중인 이름이에요. 다른 이름을 써주세요." }, { status: 409 });
    }

    // Auth 유저 생성
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });

    if (createError || !newUser.user) {
        return NextResponse.json({ error: "계정 생성에 실패했어요. 다시 시도해주세요." }, { status: 500 });
    }

    const handle = name.trim().toLowerCase().replace(/\s+/g, "_") + "_marketer";
    const badge = BADGE_MAP[type] ?? "Student";

    // 프로필 생성
    const { error: profileError } = await admin.from("profiles").insert({
        id: newUser.user.id,
        name: name.trim(),
        handle,
        avatar: avatar ?? "🦊",
        marketer_type: type,
        team: team.name,
        points: 0,
        rank: badge,
        role: "student",
    });

    if (profileError) {
        // 롤백
        await admin.auth.admin.deleteUser(newUser.user.id);
        return NextResponse.json({ error: "프로필 생성에 실패했어요." }, { status: 500 });
    }

    // 로그인
    const anonClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({ email, password });
    if (signInError) {
        return NextResponse.json({ error: "로그인 실패. 다시 시도해주세요." }, { status: 500 });
    }
    return NextResponse.json({ session: signInData.session });
}
