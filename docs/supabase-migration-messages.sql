-- =====================================================
-- messages 테이블: 게시물 공유 메시지
-- =====================================================

CREATE TABLE IF NOT EXISTS public.messages (
    id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id      uuid REFERENCES public.posts(id) ON DELETE SET NULL,
    text         text,
    read         boolean DEFAULT false,
    created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender   ON public.messages(sender_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 본인이 받거나 보낸 메시지만 조회 가능
CREATE POLICY "messages_select" ON public.messages
    FOR SELECT USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- 로그인한 사용자만 메시지 전송
CREATE POLICY "messages_insert" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 수신자만 읽음 처리 가능
CREATE POLICY "messages_update" ON public.messages
    FOR UPDATE USING (auth.uid() = receiver_id);
