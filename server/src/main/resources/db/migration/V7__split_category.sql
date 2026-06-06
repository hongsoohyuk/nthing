-- V7: 상품 카테고리 추가 (H2·PostgreSQL 공용)
-- enum name 문자열 저장(FOOD/BEVERAGE/HOUSEHOLD/BEAUTY/OTHER). 기본값 OTHER.

ALTER TABLE split_requests ADD COLUMN category VARCHAR(20) NOT NULL DEFAULT 'OTHER';

CREATE INDEX idx_split_category ON split_requests (category);
