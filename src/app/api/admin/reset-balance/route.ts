import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
    const { balance } = await request.json();

    if (typeof balance !== "number" || isNaN(balance) || balance < 0) {
        return NextResponse.json({ error: "Invalid balance value" }, { status: 400 });
    }

    const admin = createAdminClient();

    // game_state initial_balance 업데이트
    const { error: gsError } = await admin
        .from("game_state")
        .update({ initial_balance: balance })
        .eq("id", 1);

    if (gsError) {
        return NextResponse.json({ error: gsError.message }, { status: 500 });
    }

    // 전체 profiles.balance 일괄 업데이트 (admin 클라이언트로 RLS 우회)
    const { error: profileError } = await admin
        .from("profiles")
        .update({ balance })
        .neq("id", "00000000-0000-0000-0000-000000000000");

    if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
