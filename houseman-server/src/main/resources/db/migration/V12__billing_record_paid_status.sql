-- ============================================================
-- V12: billing_records 결제 상태 확장 (C1-a — pays_for 관계 정식화)
--   - status enum 확장: DRAFT/CONFIRMED/SENT → +PAID/+PARTIAL (옵션 B: CHECK 제약)
--   - paid_amount: 부분 결제 누적 추적 (BIGINT, default 0)
--   - paid_at: 최종 결제 시각 (TIMESTAMPTZ, NULL 허용)
-- ============================================================

ALTER TABLE billing_records
    ADD COLUMN paid_amount BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN paid_at     TIMESTAMPTZ NULL;

ALTER TABLE billing_records
    ADD CONSTRAINT billing_record_status_check
    CHECK (status IN ('DRAFT', 'CONFIRMED', 'SENT', 'PAID', 'PARTIAL'));

-- ── down (수동 실행용, Flyway 자동 미실행) ──
-- ALTER TABLE billing_records DROP CONSTRAINT billing_record_status_check;
-- ALTER TABLE billing_records DROP COLUMN paid_at;
-- ALTER TABLE billing_records DROP COLUMN paid_amount;
