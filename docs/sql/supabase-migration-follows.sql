-- =====================================================
-- follows 테이블: 팔로우/팔로워 시스템
-- =====================================================

CREATE TABLE IF NOT EXISTS public.follows (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at  timestamptz DEFAULT now(),
    UNIQUE(follower_id, following_id)
);

-- follower_id 로 조회 (내가 팔로우하는 사람 목록)
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
-- following_id 로 조회 (나를 팔로우하는 사람 목록)
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- RLS 활성화
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- 누구나 팔로우 관계 읽기 가능
CREATE POLICY "follows_select" ON public.follows
    FOR SELECT USING (true);

-- 로그인한 본인만 팔로우 추가/삭제 가능
CREATE POLICY "follows_insert" ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_delete" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id);
