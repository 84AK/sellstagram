import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIP } from "@/lib/auth/rateLimit";

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
    const secret = process.env.TEAM_LOGIN_SECRET;
    if (!secret) {
        throw new Error("TEAM_LOGIN_SECRET 환경변수가 설정되지 않았습니다. .env.local을 확인하세요.");
    }

    const key = `${name.trim().toLowerCase()}:${teamCode.toUpperCase()}`;

    const emailHash = createHmac("sha256", secret)
        .update(`email:${key}`)
        .digest("hex")
        .slice(0, 16);

    const passwordHash = createHmac("sha256", secret)
        .update(`password:${key}`)
        .digest("hex");

    return {
        email: `tc_${emailHash}@sellstagram.app`,
        password: `SGS_${passwordHash}`,
    };
}

/**
 * GET /api/auth/team-login?name=김지우&teamCode=ABC123
 *
 * 클라이언트 RLS 우회: 서버(admin)에서 이름 조회
 * 반환: { status: "returning" | "available" | "taken", profile? }
 */
export async function GET(req: NextRequest) {
    const ip = getClientIP(req);
    if (!checkRateLimit(`teamlookup:${ip}`, 120, 60_000)) {
        return NextResponse.json({ error: "요청이 너무 많아요. 잠시 후 다시 시도해주세요." }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name")?.trim();
    const teamCode = searchParams.get("teamCode")?.trim();

    if (!name || !teamCode) {
        return NextResponse.json({ error: "필수 파라미터 누락" }, { status: 400 });
    }

    let admin: ReturnType<typeof createAdminClient>;
    try {
        admin = createAdminClient();
    } catch {
        return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
    }

    // 팀 코드 검증
    const { data: team } = await admin
        .from("teams")
        .select("id, name, emoji")
        .eq("join_code", teamCode.toUpperCase())
        .maybeSingle();

    if (!team) {
        return NextResponse.json({ status: "invalid_team" }, { status: 400 });
    }

    // 같은 팀에 이름 있는지 확인
    const { data: sameTeamProfile } = await admin
        .from("profiles")
        .select("id, avatar, marketer_type")
        .eq("name", name)
        .eq("team", team.name)
        .maybeSingle();

    if (sameTeamProfile) {
        return NextResponse.json({
            status: "returning",
            profile: {
                avatar: sameTeamProfile.avatar ?? "🦊",
                marketer_type: sameTeamProfile.marketer_type ?? null,
                team: team.name,
                team_emoji: team.emoji ?? "",
            },
        });
    }

    // 다른 팀에 동명이 있는지 확인
    const { data: otherTeamProfile } = await admin
        .from("profiles")
        .select("id")
        .eq("name", name)
        .limit(1);

    if ((otherTeamProfile?.length ?? 0) > 0) {
        return NextResponse.json({ status: "taken" });
    }

    return NextResponse.json({ status: "available" });
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
    const ip = getClientIP(req);
    if (!checkRateLimit(`teamlogin:${ip}`, 60, 60_000)) {
        return NextResponse.json(
            { error: "너무 많은 요청입니다. 1분 후 다시 시도해주세요." },
            { status: 429 }
        );
    }

    let body: { name?: string; teamCode?: string; type?: string; avatar?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    const { name, teamCode, type, avatar } = body;

    if (!name?.trim() || !teamCode?.trim()) {
        return NextResponse.json({ error: "이름과 팀 코드를 입력해주세요" }, { status: 400 });
    }

    let admin: ReturnType<typeof createAdminClient>;
    try {
        admin = createAdminClient();
    } catch {
        return NextResponse.json({ error: "서버 설정 오류입니다." }, { status: 500 });
    }

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

    let credentials: { email: string; password: string };
    try {
        credentials = makeCredentials(name, teamCode);
    } catch {
        return NextResponse.json({ error: "서버 설정 오류입니다. 관리자에게 문의하세요." }, { status: 500 });
    }
    const { email, password } = credentials;

    if (existingProfile) {
        // ── 소셜 로그인 계정 보호 ──
        // Google/Kakao로 가입한 유저의 credentials를 덮어쓰지 않음
        const { data: { user: authUser } } = await admin.auth.admin.getUserById(existingProfile.id);
        const hasSocialIdentity = authUser?.identities?.some(
            (identity) => identity.provider !== "email"
        );

        if (hasSocialIdentity) {
            return NextResponse.json(
                {
                    error: "이 계정은 소셜 로그인(Google/Kakao)으로 가입되어 있어요.\n상단의 '소셜 로그인' 탭을 이용해주세요.",
                    isSocialUser: true,
                },
                { status: 400 }
            );
        }

        // ── 팀 코드 기반 기존 유저: 재로그인 ──
        const { error: updateError } = await admin.auth.admin.updateUserById(existingProfile.id, {
            email,
            password,
            email_confirm: true,
        });

        if (updateError) {
            console.error("[team-login] updateUserById 실패:", updateError.message);
            return NextResponse.json({ error: "계정 업데이트에 실패했어요. 관리자에게 문의하세요." }, { status: 500 });
        }

        const anonClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );
        const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({ email, password });
        if (signInError) {
            console.error("[team-login] signInWithPassword 실패:", signInError.message);
            return NextResponse.json({ error: "로그인 실패. 선생님께 문의해주세요." }, { status: 400 });
        }
        return NextResponse.json({ session: signInData.session });
    }

    // ── 신규 유저 ──
    if (!type) {
        return NextResponse.json({ isNewUser: true, team }, { status: 200 });
    }

    const VALID_TYPES = ["creator", "analyst", "storyteller", "innovator"] as const;
    if (!VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
        return NextResponse.json({ error: "올바르지 않은 마케터 타입이에요." }, { status: 400 });
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
        await admin.auth.admin.deleteUser(newUser.user.id);
        return NextResponse.json({ error: "프로필 생성에 실패했어요." }, { status: 500 });
    }

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
