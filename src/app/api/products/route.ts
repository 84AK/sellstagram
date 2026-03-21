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

// GET /api/products — 상품 목록 조회 (누구나 가능, admin 클라이언트로 RLS 우회)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true"; // 관리자: 비활성 포함

    const admin = createAdminClient();
    let query = admin
        .from("products")
        .select("id,name,description,price,cost,category,xp_bonus,is_active,image_url,sort_order,detail_images,stock")
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("created_at");

    if (!all) {
        query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] }, {
        headers: {
            // 30초 엣지 캐시 + 60초 stale-while-revalidate (상품 목록은 자주 안 바뀜)
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
    });
}

// POST /api/products — 상품 생성
export async function POST(request: NextRequest) {
    if (!(await isAuthorized(request))) {
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
