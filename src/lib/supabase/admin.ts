import { createClient } from "@supabase/supabase-js";

// 서버 전용 클라이언트 - Service Role Key로 RLS 우회
// 절대 클라이언트 컴포넌트에서 import 금지
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!url || !serviceRoleKey) {
        throw new Error("Supabase admin client: missing env vars");
    }

    return createClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}
