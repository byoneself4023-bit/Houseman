-- ============================================================
-- V9: Cashbook + Parking DDL
-- ============================================================

-- ── cashbook_entries: 출납장 ──
CREATE TABLE cashbook_entries (
    id              BIGSERIAL PRIMARY KEY,
    building_id     BIGINT NOT NULL REFERENCES buildings(id),
    date            DATE NOT NULL,
    type            VARCHAR(20) NOT NULL DEFAULT 'manual',
    direction       VARCHAR(10) NOT NULL DEFAULT '출금',
    description     VARCHAR(200) NOT NULL DEFAULT '',
    amount          BIGINT NOT NULL DEFAULT 0,
    account         VARCHAR(100) NOT NULL DEFAULT '',
    account_holder  VARCHAR(50) NOT NULL DEFAULT '',
    status          VARCHAR(10) NOT NULL DEFAULT '대기',
    sent_at         TIMESTAMPTZ,
    source_id       VARCHAR(100),
    room            VARCHAR(20) NOT NULL DEFAULT '',
    round           INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cashbook_building_date ON cashbook_entries(building_id, date);
CREATE UNIQUE INDEX idx_cashbook_source_id ON cashbook_entries(source_id) WHERE source_id IS NOT NULL;

-- ── parking_infos: 주차 관리 ──
CREATE TABLE parking_infos (
    id              BIGSERIAL PRIMARY KEY,
    building_id     BIGINT NOT NULL REFERENCES buildings(id),
    contract_id     BIGINT REFERENCES contracts(id),
    tenant_name     VARCHAR(50) NOT NULL DEFAULT '',
    room_number     VARCHAR(20) NOT NULL DEFAULT '',
    car_number      VARCHAR(30) NOT NULL DEFAULT '',
    car_type        VARCHAR(50) NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_parking_building ON parking_infos(building_id);
