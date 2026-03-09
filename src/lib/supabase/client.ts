import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// URL이 유효한 http/https 형식인지 확인하고, 아니면 안전한 플레이스홀더 사용
const supabaseUrl = rawUrl.startsWith("https://") && rawUrl.length > 20
    ? rawUrl
    : "https://not-configured.supabase.co";
const supabaseAnonKey = rawKey.length > 10 ? rawKey : "not-configured";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        flowType: "implicit", // PKCE 대신 implicit 방식 사용 (교실 환경에 적합)
    },
});

// 실제 Supabase가 연결됐는지 확인
export const isSupabaseConfigured =
    rawUrl.startsWith("https://") &&
    rawUrl.length > 20 &&
    !rawUrl.includes("not-configured");

// Database types
export interface DbProfile {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    avatar_config?: Record<string, string> | null; // SQL: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_config JSONB DEFAULT '{}'
    marketer_type: string | null;
    team: string;
    points: number;
    rank: string;
    created_at: string;
}

export interface DbPost {
    id: string;
    user_id: string | null;
    user_name: string;
    user_handle: string;
    user_avatar: string;
    type: "post" | "video";
    caption: string | null;
    image_url: string | null;
    description: string | null;
    music_name: string | null;
    tags: string[];
    likes: number;
    comments: number;
    shares: number;
    engagement_rate: string;
    sales: string | null;
    highlighted: boolean;
    created_at: string;
    week: number | null;
}

export interface DbMission {
    id: string;
    title: string;
    description: string;
    target_revenue: number;
    reward: number;
    is_active: boolean;
    created_at: string;
}

export interface DbGameState {
    id: number;
    week: number;
    is_session_active: boolean;
    updated_at: string;
}
