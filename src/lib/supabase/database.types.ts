/**
 * Minimal Supabase database types for server-side admin client.
 * Generated manually to avoid requiring Supabase CLI in the project.
 * Update this file when adding or modifying database tables.
 */

export type Database = {
    public: {
        Tables: {
            game_state: {
                Row: {
                    id: number;
                    initial_balance: number;
                    teacher_pin: string | null;
                };
                Insert: {
                    id?: number;
                    initial_balance?: number;
                    teacher_pin?: string | null;
                };
                Update: {
                    id?: number;
                    initial_balance?: number;
                    teacher_pin?: string | null;
                };
                Relationships: [];
            };
            app_settings: {
                Row: {
                    id: number;
                    gemini_api_key: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    id?: number;
                    gemini_api_key?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    id?: number;
                    gemini_api_key?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
            profiles: {
                Row: {
                    id: string;
                    name: string | null;
                    handle: string | null;
                    avatar: string | null;
                    marketer_type: string | null;
                    team: string | null;
                    points: number | null;
                    rank: string | null;
                    role: string | null;
                    balance: number | null;
                };
                Insert: {
                    id: string;
                    name?: string | null;
                    handle?: string | null;
                    avatar?: string | null;
                    marketer_type?: string | null;
                    team?: string | null;
                    points?: number | null;
                    rank?: string | null;
                    role?: string | null;
                    balance?: number | null;
                };
                Update: {
                    id?: string;
                    name?: string | null;
                    handle?: string | null;
                    avatar?: string | null;
                    marketer_type?: string | null;
                    team?: string | null;
                    points?: number | null;
                    rank?: string | null;
                    role?: string | null;
                    balance?: number | null;
                };
                Relationships: [];
            };
            teams: {
                Row: {
                    id: string;
                    name: string;
                    emoji: string | null;
                    color: string | null;
                    join_code: string | null;
                    created_at: string | null;
                };
                Insert: {
                    id?: string;
                    name: string;
                    emoji?: string | null;
                    color?: string | null;
                    join_code?: string | null;
                };
                Update: {
                    id?: string;
                    name?: string;
                    emoji?: string | null;
                    color?: string | null;
                    join_code?: string | null;
                };
                Relationships: [];
            };
            products: {
                Row: {
                    id: string;
                    name: string;
                    description: string | null;
                    price: number;
                    cost: number | null;
                    category: string | null;
                    xp_bonus: number | null;
                    is_active: boolean;
                    image_url: string | null;
                    sort_order: number | null;
                    detail_images: string[] | null;
                    stock: number | null;
                    created_at: string | null;
                };
                Insert: {
                    id?: string;
                    name: string;
                    description?: string | null;
                    price?: number;
                    cost?: number | null;
                    category?: string | null;
                    xp_bonus?: number | null;
                    is_active?: boolean;
                    image_url?: string | null;
                    sort_order?: number | null;
                    detail_images?: string[] | null;
                    stock?: number | null;
                };
                Update: {
                    id?: string;
                    name?: string;
                    description?: string | null;
                    price?: number;
                    cost?: number | null;
                    category?: string | null;
                    xp_bonus?: number | null;
                    is_active?: boolean;
                    image_url?: string | null;
                    sort_order?: number | null;
                    detail_images?: string[] | null;
                    stock?: number | null;
                };
                Relationships: [];
            };
            simulation_results: {
                Row: {
                    id: string;
                    user_id: string | null;
                    user_name: string | null;
                    user_handle: string | null;
                    post_id: string | null;
                    post_caption: string | null;
                    post_image: string | null;
                    session_started_at: string | null;
                    duration_minutes: number | null;
                    total_likes: number | null;
                    total_comments: number | null;
                    total_shares: number | null;
                    total_purchases: number | null;
                    total_revenue: number | null;
                    events: Record<string, unknown>[] | null;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    user_name?: string | null;
                    user_handle?: string | null;
                    post_id?: string | null;
                    post_caption?: string | null;
                    post_image?: string | null;
                    session_started_at?: string | null;
                    duration_minutes?: number | null;
                    total_likes?: number | null;
                    total_comments?: number | null;
                    total_shares?: number | null;
                    total_purchases?: number | null;
                    total_revenue?: number | null;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    events?: any;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                };
                Relationships: [];
            };
            missions: {
                Row: {
                    id: string;
                    title: string | null;
                    description: string | null;
                    points: number | null;
                    completed: boolean | null;
                    active: boolean | null;
                };
                Insert: {
                    id?: string;
                    title?: string | null;
                    description?: string | null;
                    points?: number | null;
                    completed?: boolean | null;
                    active?: boolean | null;
                };
                Update: {
                    id?: string;
                    title?: string | null;
                    description?: string | null;
                    points?: number | null;
                    completed?: boolean | null;
                    active?: boolean | null;
                };
                Relationships: [];
            };
            posts: {
                Row: {
                    id: string;
                };
                Insert: {
                    id?: string;
                };
                Update: {
                    id?: string;
                };
                Relationships: [];
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
};
