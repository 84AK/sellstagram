-- teams 테이블에 join_code 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE;

-- 기존 팀들에 랜덤 코드 생성 (이미 코드가 없는 경우)
UPDATE teams
SET join_code = upper(substring(md5(random()::text), 1, 6))
WHERE join_code IS NULL;
