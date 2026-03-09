import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminToken } from "@/lib/admin/token";
import { invalidateApiKeyCache } from "@/lib/ai/gemini";

// GET: 현재 키 등록 상태 확인 (마스킹 처리)
export async function GET(request: NextRequest) {
    const token = request.cookies.get("admin_token")?.value ?? "";
    if (!verifyAdminToken(token)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const admin = createAdminClient();
        const { data, error } = await admin
            .from("app_settings")
            .select("gemini_api_key")
            .eq("id", 1)
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        const key: string | null = data?.gemini_api_key ?? null;
        const masked = key && key.length > 8
            ? `${key.slice(0, 4)}${"*".repeat(key.length - 8)}${key.slice(-4)}`
            : key ? "****" : null;

        return NextResponse.json({ hasKey: !!key, masked });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// POST: 새 키 저장
export async function POST(request: NextRequest) {
    const token = request.cookies.get("admin_token")?.value ?? "";
    if (!verifyAdminToken(token)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { apiKey } = await request.json();
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 10) {
        return NextResponse.json({ error: "유효한 API 키를 입력해주세요." }, { status: 400 });
    }

    try {
        const admin = createAdminClient();
        const { error } = await admin
            .from("app_settings")
            .update({ gemini_api_key: apiKey.trim(), updated_at: new Date().toISOString() })
            .eq("id", 1);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        invalidateApiKeyCache(); // 새 키 즉시 반영
        return NextResponse.json({ ok: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// DELETE: 키 삭제 (env var fallback으로 복귀)
export async function DELETE(request: NextRequest) {
    const token = request.cookies.get("admin_token")?.value ?? "";
    if (!verifyAdminToken(token)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const admin = createAdminClient();
        const { error } = await admin
            .from("app_settings")
            .update({ gemini_api_key: null, updated_at: new Date().toISOString() })
            .eq("id", 1);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        invalidateApiKeyCache(); // 삭제 시에도 캐시 무효화
        return NextResponse.json({ ok: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
