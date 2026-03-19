import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIP } from "@/lib/auth/rateLimit";

export async function POST(request: NextRequest) {
    // Rate limiting: IP당 분당 5회 이하
    const ip = getClientIP(request);
    if (!checkRateLimit(`pin:${ip}`, 5, 60_000)) {
        return NextResponse.json(
            { valid: false, error: "너무 많은 시도입니다. 1분 후 다시 시도하세요." },
            { status: 429 }
        );
    }

    const { pin } = await request.json();
    if (!pin) return NextResponse.json({ valid: false }, { status: 400 });

    // admin 클라이언트로 RLS 없이 teacher_pin 조회
    const admin = createAdminClient();
    const { data, error } = await admin
        .from("game_state")
        .select("teacher_pin")
        .eq("id", 1)
        .single();

    // DB 조회 실패 시 인증 거부 (기본값 "1234" 제거)
    if (error || !data?.teacher_pin) {
        return NextResponse.json(
            { valid: false, error: "PIN이 설정되지 않았습니다. 관리자에게 문의하세요." },
            { status: 503 }
        );
    }

    if (pin !== data.teacher_pin) {
        return NextResponse.json({ valid: false }, { status: 401 });
    }

    const res = NextResponse.json({ valid: true });
    res.cookies.set("teacher_auth", "true", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8, // 8시간
    });
    return res;
}
