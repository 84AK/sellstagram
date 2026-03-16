-- =====================================================
-- Migration: inventory-quantity
-- 2026-03-16
-- purchases 테이블에 수량 컬럼 추가
-- =====================================================

-- 1. quantity(구매 수량), sold_quantity(판매된 수량) 추가
alter table public.purchases
    add column if not exists quantity integer not null default 1,
    add column if not exists sold_quantity integer not null default 0;

-- 2. 기존 데이터: 이미 구매한 row는 quantity=1, sold_quantity=0으로 초기화됨 (default 적용)
