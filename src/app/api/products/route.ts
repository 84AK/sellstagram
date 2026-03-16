import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminToken } from "@/lib/admin/token";

function isAuthorized(request: NextRequest): boolean {
    const adminToken = request.cookies.get("admin_token")?.value ?? "";
    if (verifyAdminToken(adminToken)) return true;
    const teacherAuth = request.cookies.get("teacher_auth")?.value;
    if (teacherAuth === "true") return true;
    return false;
}

// POST /api/products — 상품 생성
export async function POST(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, price, cost, category, xp_bonus, image_url, detail_images, stock, sort_order } = body;

    if (!name?.trim()) {
        return NextResponse.json({ error: "상품명은 필수입니다" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
        .from("products")
        .insert({
            name: name.trim(),
            description: description ?? "",
            price: price ?? 50000,
            cost: cost ?? 20000,
            category: category ?? "General",
            xp_bonus: xp_bonus ?? 10,
            image_url: image_url || null,
            detail_images: detail_images ?? [],
            stock: stock ?? 100,
            is_active: true,
            sort_order: sort_order ?? 0,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
}
