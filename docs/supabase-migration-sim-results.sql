-- =====================================================
-- simulation_results 테이블 생성 + Realtime 활성화
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

-- 테이블 생성 (없는 경우)
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

-- RLS 활성화
alter table public.simulation_results enable row level security;

-- RLS 정책 (없는 경우)
do $$
begin
    if not exists (
        select 1 from pg_policies
        where tablename = 'simulation_results' and policyname = 'sim_results_read'
    ) then
        create policy "sim_results_read" on public.simulation_results for select using (true);
    end if;
    if not exists (
        select 1 from pg_policies
        where tablename = 'simulation_results' and policyname = 'sim_results_insert'
    ) then
        create policy "sim_results_insert" on public.simulation_results for insert with check (true);
    end if;
end
$$;

-- Realtime 활성화 (선생님 실시간 모니터링용)
alter publication supabase_realtime add table public.simulation_results;
