import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { subscription, userId, userName } = await req.json();

        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from("push_subscriptions")
            .upsert({
                endpoint:  subscription.endpoint,
                p256dh:    subscription.keys.p256dh,
                auth:      subscription.keys.auth,
                user_id:   userId   || null,
                user_name: userName || null,
                updated_at: new Date().toISOString(),
            }, { onConflict: "endpoint" });

        if (error) throw error;

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[push/subscribe]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { endpoint } = await req.json();
        if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });

        await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", endpoint);
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[push/unsubscribe]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
