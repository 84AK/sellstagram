import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/purchases
 * 구매 처리 (RLS 우회) — 판매자 잔액 적립 + virtual_sales 기록
 * body: { post_id, seller_id, buyer_id (null for anonymous), amount, buyer_balance_after (optional) }
 */
export async function POST(req: NextRequest) {
    let body: {
        post_id: string;
        seller_id: string | null;
        buyer_id: string | null;
        amount: number;
        buyer_balance_after?: number;
    };

    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    const { post_id, seller_id, buyer_id, amount, buyer_balance_after } = body;

    if (!post_id || !amount || amount <= 0) {
        return NextResponse.json({ error: "필수 파라미터가 누락되었습니다." }, { status: 400 });
    }

    const admin = createAdminClient();

    // 판매자 잔액 적립
    if (seller_id) {
        const { data: sellerProf } = await admin
            .from("profiles")
            .select("balance")
            .eq("id", seller_id)
            .single();

        const newSellerBal = (sellerProf?.balance ?? 0) + amount;
        await admin.from("profiles").update({ balance: newSellerBal }).eq("id", seller_id);
    }

    // 구매자 잔액 차감 (로그인 유저만, buyer_balance_after 제공 시)
    if (buyer_id && buyer_balance_after !== undefined) {
        await admin
            .from("profiles")
            .update({ balance: buyer_balance_after })
            .eq("id", buyer_id);
    }

    // virtual_sales 기록
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("virtual_sales").insert({
        post_id,
        seller_id: seller_id ?? null,
        buyer_id: buyer_id ?? null,
        amount,
    });

    return NextResponse.json({ ok: true });
}
