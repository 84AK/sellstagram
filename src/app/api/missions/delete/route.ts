import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: NextRequest) {
    const { id } = await request.json();

    if (!id) {
        return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("missions").delete().eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
