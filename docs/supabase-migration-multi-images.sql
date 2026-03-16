-- =====================================================
-- Migration: multi-images
-- 2026-03-16
-- posts 테이블에 다중 이미지 배열 컬럼 추가
-- =====================================================

alter table public.posts
    add column if not exists images text[] default '{}';
