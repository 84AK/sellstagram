-- =====================================================
-- Migration: landing-page & virtual-sales
-- 2026-03-16
-- =====================================================

-- 1. posts 테이블에 랜딩 페이지 관련 컬럼 추가
alter table public.posts
    add column if not exists landing_images text[] default '{}',
    add column if not exists selling_price integer default null,
    add column if not exists sold_count integer default 0,
    add column if not exists seller_user_id uuid references public.profiles(id) on delete set null;

-- 2. virtual_sales 테이블 (학생 간 가상 구매 거래 기록)
create table if not exists public.virtual_sales (
    id uuid primary key default gen_random_uuid(),
    post_id uuid references public.posts(id) on delete cascade,
    seller_id uuid references public.profiles(id) on delete set null,
    buyer_id uuid references public.profiles(id) on delete set null,
    amount integer not null,
    created_at timestamptz default now()
);

-- RLS
alter table public.virtual_sales enable row level security;
create policy "virtual_sales_read"   on public.virtual_sales for select using (true);
create policy "virtual_sales_insert" on public.virtual_sales for insert with check (auth.uid() = buyer_id);

-- 3. Realtime 활성화
alter publication supabase_realtime add table public.virtual_sales;
