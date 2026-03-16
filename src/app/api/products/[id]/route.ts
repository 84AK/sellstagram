import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminToken } from "@/lib/admin/token";

// admin_token 쿠키, teacher_auth 쿠키, 또는 Supabase Bearer 토큰(role=teacher) 허용
async function isAuthorized(request: NextRequest): Promise<boolean> {
    // 1) admin_token 쿠키
    const adminToken = request.cookies.get("admin_token")?.value ?? "";
    if (verifyAdminToken(adminToken)) return true;

    // 2) teacher_auth 쿠키 (PIN 로그인)
    if (request.cookies.get("teacher_auth")?.value === "true") return true;

    // 3) Supabase Bearer 토큰 + profiles.role = 'teacher'
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "").trim();
    if (token) {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
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

// PATCH /api/products/[id] — 상품 수정 (부분 업데이트)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isAuthorized(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await request.json();

    const admin = createAdminClient();
    const { error } = await admin.from("products").update(body).eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}

// DELETE /api/products/[id] — 상품 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isAuthorized(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin.from("products").delete().eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
