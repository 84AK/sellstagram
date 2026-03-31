import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminToken } from "@/lib/admin/token";

/**
 * 🔒 교사 전용 시스템 업데이트 API
 * 클라이언트에서 직접 RLS를 우회할 수 없도록, 서버사이드(Admin Client)에서 안전하게 처리합니다.
 */
export async function POST(request: NextRequest) {
    // 1. 관리자 토큰 검증 (Cookie: admin_token)
    const token = request.cookies.get("admin_token")?.value ?? "";
    if (!verifyAdminToken(token)) {
        return NextResponse.json({ error: "권한이 없습니다. (Unauthorized)" }, { status: 401 });
    }

    try {
        const { action, table, id, data } = await request.json();
        const admin = createAdminClient();

        // 2. 허용된 테이블 및 액션 화이트리스트
        const ALLOWED_TABLES = ["game_state", "missions", "posts", "app_settings", "products"];
        if (!ALLOWED_TABLES.includes(table)) {
            return NextResponse.json({ error: "허용되지 않은 테이블 접근입니다." }, { status: 403 });
        }

        // 3. 액션 분기 처리
        let result: any;

        if (action === "update") {
            const { error, data: updated } = await admin
                .from(table)
                .update({ ...data, updated_at: new Date().toISOString() })
                .eq("id", id || 1) // id가 없으면 기본값 1 (game_state, app_settings용)
                .select()
                .single();
            
            if (error) throw error;
            result = updated;

        } else if (action === "delete_all_posts") {
            // "0" 아이디 하나를 제외한 모든 게시물 삭제 (초기화)
            const { error } = await admin
                .from("posts")
                .delete()
                .neq("id", "00000000-0000-0000-0000-000000000000");
                
            if (error) throw error;
            result = { ok: true };

        } else {
            return NextResponse.json({ error: "알 수 없는 액션입니다." }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error("[Teacher System API Error]:", error);
        return NextResponse.json({ error: error.message || "서버에서 오류가 발생했습니다." }, { status: 500 });
    }
}
