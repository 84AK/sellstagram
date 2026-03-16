-- =====================================================
-- Fix: posts.comments 카운트에서 AI 반응 댓글 제외
-- =====================================================

-- 1. 트리거 함수 수정: is_ai_reaction = false인 댓글만 카운트
CREATE OR REPLACE FUNCTION public.update_post_comment_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.is_ai_reaction IS DISTINCT FROM true THEN
            UPDATE public.posts SET comments = comments + 1 WHERE id = NEW.post_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.is_ai_reaction IS DISTINCT FROM true THEN
            UPDATE public.posts SET comments = comments - 1 WHERE id = OLD.post_id;
        END IF;
    END IF;
    RETURN null;
END;
$$;

-- 2. 기존 데이터 재계산: 실제 유저 댓글(is_ai_reaction = false)만 집계
UPDATE public.posts p
SET comments = (
    SELECT COUNT(*)
    FROM public.comments c
    WHERE c.post_id = p.id
      AND (c.is_ai_reaction IS DISTINCT FROM true)
);
