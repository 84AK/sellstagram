import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminToken } from "@/lib/admin/token";

/**
 * API 라우트에서 교사/관리자 권한을 확인하는 공통 헬퍼
 *
 * 아래 세 가지 방법 중 하나라도 통과하면 true:
 *  1. admin_token 쿠키 (관리자 대시보드 로그인)
 *  2. Authorization: Bearer <supabase_access_token> 헤더 + profiles.role === "teacher"
 *  3. teacher_auth 쿠키 (PIN 인증 후 설정, 레거시 지원)
 */
export async function verifyTeacherOrAdmin(request: NextRequest): Promise<boolean> {
    // 1. 관리자 토큰 쿠키
    const adminToken = request.cookies.get("admin_token")?.value ?? "";
    if (verifyAdminToken(adminToken)) return true;

    // 2. teacher_auth 쿠키 (PIN 인증)
    const teacherCookie = request.cookies.get("teacher_auth")?.value;
    if (teacherCookie === "true") return true;

    // 3. Supabase JWT + teacher 역할 확인
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return false;

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) return false;

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        return profile?.role === "teacher";
    } catch {
        return false;
    }
}
