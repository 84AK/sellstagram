import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    const { pin } = await request.json();
    if (!pin) return NextResponse.json({ valid: false }, { status: 400 });

    // DB에서 현재 teacher_pin 조회
    const { data } = await supabase
        .from("game_state")
        .select("teacher_pin")
        .eq("id", 1)
        .single();

    // DB에 PIN이 없으면 env fallback
    const correctPin = data?.teacher_pin ?? process.env.TEACHER_PIN ?? "1234";

    if (pin !== correctPin) {
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
