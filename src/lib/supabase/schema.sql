-- =====================================================
-- Sellstagram (셀스타그램) Database Schema
-- Supabase SQL Editor에서 순서대로 실행하세요
-- =====================================================

-- 1. Profiles (학생 프로필)
create table if not exists public.profiles (
    id uuid primary key,  -- auth.users.id와 동일
    name text not null,
    handle text unique not null,
    avatar text default '🦊',
    marketer_type text,   -- creator | analyst | storyteller | innovator
    team text default 'A팀',
    is_leader boolean default false,
    points integer default 0,
    rank text default 'Beginner',
    balance integer default 1000000,
    created_at timestamptz default now()
);

-- 2. Posts (공유 피드)
create table if not exists public.posts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete set null,
    user_name text not null,
    user_handle text not null,
    user_avatar text default '🦊',
    type text default 'post',         -- 'post' | 'video'
    caption text,
    image_url text,
    description text,
    music_name text,
    tags text[] default '{}',
    likes integer default 0,
    comments integer default 0,
    shares integer default 0,
    engagement_rate text default '0%',
    sales text,
    highlighted boolean default false, -- 교사가 강조 표시
    created_at timestamptz default now()
);

-- 3. Missions (미션 목록 - 교사가 관리)
create table if not exists public.missions (
    id text primary key,
    title text not null,
    description text,
    target_revenue integer default 0,
    reward integer default 0,
    is_active boolean default true,
    created_at timestamptz default now()
);

-- 기본 미션 데이터
insert into public.missions (id, title, description, target_revenue, reward, is_active) values
    ('m1', '환경 보호의 첫걸음', '친환경 제품 매출 500만원 달성하기', 5000000, 1000000, true),
    ('m2', 'Z세대의 마음을 훔쳐라', '인게이지먼트 10% 이상 게시물 3개 업로드', 0, 500000, true)
on conflict (id) do nothing;

-- 4. Mission Completions (미션 완료 기록)
create table if not exists public.mission_completions (
    id uuid primary key default gen_random_uuid(),
    mission_id text references public.missions(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    completed_at timestamptz default now(),
    unique(mission_id, user_id)
);

-- 5. Game State (수업 상태 - 교사가 제어, 단일 row)
create table if not exists public.game_state (
    id integer primary key default 1,
    week integer default 1,
    is_session_active boolean default false,
    teacher_pin text default '1234',
    initial_balance integer default 1000000,
    updated_at timestamptz default now()
);

insert into public.game_state (id, week, is_session_active, teacher_pin, initial_balance)
values (1, 1, false, '1234', 1000000)
on conflict (id) do nothing;

-- 6. Products (셀러샵 상품 - 교사가 관리)
create table if not exists public.products (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    price integer not null default 0,
    cost integer not null default 0,
    category text default 'General',
    stock integer default 100,
    image_url text,
    xp_bonus integer default 10,
    is_active boolean default true,
    sort_order integer,
    created_at timestamptz default now()
);

insert into public.products (name, description, price, cost, category, stock, xp_bonus, is_active) values
    ('에코 스마트워치 V2', '지속 가능한 소재로 제작된 프리미엄 스마트워치. 높은 가독성과 강력한 배터리가 특징입니다.', 450000, 150000, 'Gadget', 100, 30, true),
    ('미니멀리스트 랩탑 파우치', '업사이클링 원단으로 제작된 스타일리시한 파우치. MZ세대의 감성을 자극하는 색상 구성입니다.', 35000, 12000, 'Accessory', 500, 10, true),
    ('네온 LED 무선 이어폰', '화려한 LED 효과와 고퀄리티 사운드를 제공하는 무선 이어폰. 스트릿 마케팅에 최적화된 아이템입니다.', 89000, 32000, 'Audio', 200, 20, true)
on conflict do nothing;

-- 7. Purchases (구매 기록)
create table if not exists public.purchases (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade,
    product_id uuid references public.products(id) on delete cascade,
    purchased_at timestamptz default now(),
    unique(user_id, product_id)
);

-- 8. Comments (게시물 댓글)
create table if not exists public.comments (
    id uuid primary key default gen_random_uuid(),
    post_id uuid references public.posts(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete set null,
    user_name text not null,
    user_handle text not null,
    text text not null,
    created_at timestamptz default now()
);

-- =====================================================
-- Realtime 활성화 (Supabase Dashboard > Database > Replication에서도 설정 가능)
-- =====================================================
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.game_state;
alter publication supabase_realtime add table public.missions;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.simulation_results;

-- =====================================================
-- Row Level Security (RLS) 정책
-- 교실 환경이므로 간단하게 설정
-- =====================================================

-- profiles: 누구나 읽기, 본인만 쓰기
alter table public.profiles enable row level security;
create policy "profiles_read" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- posts: 누구나 읽기, 로그인한 사용자만 쓰기
alter table public.posts enable row level security;
create policy "posts_read" on public.posts for select using (true);
create policy "posts_insert" on public.posts for insert with check (auth.uid() is not null);
create policy "posts_update" on public.posts for update using (true);
create policy "posts_delete" on public.posts for delete using (true);

-- missions: 누구나 읽기, 쓰기는 서비스 키로만 (교사 대시보드)
alter table public.missions enable row level security;
create policy "missions_read" on public.missions for select using (true);
create policy "missions_update" on public.missions for update using (true);

-- mission_completions: 누구나 읽기/쓰기
alter table public.mission_completions enable row level security;
create policy "completions_read" on public.mission_completions for select using (true);
create policy "completions_insert" on public.mission_completions for insert with check (auth.uid() is not null);

-- game_state: 누구나 읽기, 쓰기 허용 (교사 PIN으로 별도 보호)
alter table public.game_state enable row level security;
create policy "game_state_read" on public.game_state for select using (true);
create policy "game_state_update" on public.game_state for update using (true);

-- products: 누구나 읽기, 쓰기는 관리(교사)
alter table public.products enable row level security;
create policy "products_read" on public.products for select using (true);
create policy "products_write" on public.products for all using (true);

-- purchases: 본인 기록 읽기/쓰기
alter table public.purchases enable row level security;
create policy "purchases_read" on public.purchases for select using (true);
create policy "purchases_insert" on public.purchases for insert with check (auth.uid() = user_id);

-- comments: 누구나 읽기, 로그인한 사용자만 쓰기
alter table public.comments enable row level security;
create policy "comments_read" on public.comments for select using (true);
create policy "comments_insert" on public.comments for insert with check (auth.uid() is not null);

-- posts.comments 카운트 자동 동기화 트리거
create or replace function public.update_post_comment_count()
returns trigger language plpgsql as $$
begin
    if TG_OP = 'INSERT' then
        update public.posts set comments = comments + 1 where id = NEW.post_id;
    elsif TG_OP = 'DELETE' then
        update public.posts set comments = comments - 1 where id = OLD.post_id;
    end if;
    return null;
end;
$$;

create trigger comments_count_trigger
after insert or delete on public.comments
for each row execute function public.update_post_comment_count();

-- =====================================================
-- simulation_results: 마켓 시뮬레이션 결과 저장
-- =====================================================
create table if not exists public.simulation_results (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete set null,
    user_name text,
    user_handle text,
    post_id uuid,
    post_caption text,
    post_image text,
    session_started_at timestamptz,
    duration_minutes integer default 10,
    total_likes integer default 0,
    total_comments integer default 0,
    total_shares integer default 0,
    total_purchases integer default 0,
    total_revenue integer default 0,
    events jsonb,
    created_at timestamptz default now()
);

alter table public.simulation_results enable row level security;
create policy "sim_results_read" on public.simulation_results for select using (true);
create policy "sim_results_insert" on public.simulation_results for insert with check (true);

-- =====================================================
-- app_settings: 수업 상태 관리 (선생님이 수업 시작/종료 제어)
-- =====================================================
create table if not exists public.app_settings (
    id integer primary key default 1,
    class_active boolean default false,
    updated_at timestamptz default now()
);

-- 초기 데이터 (row는 항상 1개)
insert into public.app_settings (id, class_active) values (1, false)
on conflict (id) do nothing;

-- RLS: 누구나 읽기 가능, 쓰기는 제한 없음 (관리자/선생님은 쿠키/role로 앱에서 제어)
alter table public.app_settings enable row level security;
create policy "app_settings_read" on public.app_settings for select using (true);
create policy "app_settings_write" on public.app_settings for update using (true);
