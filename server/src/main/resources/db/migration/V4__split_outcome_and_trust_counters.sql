-- V4: 거래 결과 추적 + 반띵 성사율 카운터 (H2·PostgreSQL 공용)

ALTER TABLE split_participants ADD COLUMN outcome VARCHAR(30) NOT NULL DEFAULT 'JOINED';
ALTER TABLE split_participants ADD COLUMN author_confirmed_at TIMESTAMP;
ALTER TABLE split_participants ADD COLUMN participant_confirmed_at TIMESTAMP;
ALTER TABLE split_participants ADD COLUMN broken_reason_tag VARCHAR(30);

ALTER TABLE users ADD COLUMN completed_count   INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN late_cancel_count INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN broken_count      INT NOT NULL DEFAULT 0;
