-- =====================================================
-- Migration: instagram-profile
-- 2026-03-13
-- =====================================================

-- 1. profiles 테이블에 bio, profile_link 추가
alter table public.profiles
    add column if not exists bio text,
    add column if not exists profile_link text,
    add column if not exists role text default 'student';

-- 2. post_likes 테이블 (좋아요 토글, 중복 방지)
create table if not exists public.post_likes (
    post_id uuid references public.posts(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    created_at timestamptz default now(),
    primary key (post_id, user_id)
);

-- RLS
alter table public.post_likes enable row level security;
create policy "post_likes_read"   on public.post_likes for select using (true);
create policy "post_likes_insert" on public.post_likes for insert with check (auth.uid() = user_id);
create policy "post_likes_delete" on public.post_likes for delete using (auth.uid() = user_id);

-- 3. comments 테이블에 user_avatar 추가 (없는 경우만)
alter table public.comments
    add column if not exists user_avatar text default '🦊';

-- 4. Realtime 활성화
alter publication supabase_realtime add table public.post_likes;
