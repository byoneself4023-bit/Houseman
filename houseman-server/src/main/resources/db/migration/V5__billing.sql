-- ============================================================
-- V5: Billing domain DDL (settlement_master, billing_configs, billing_records)
-- ============================================================

-- ── settlement_master: 건물별 정산 마스터 (billingMaster.ts) ──
CREATE TABLE settlement_master (
    id                      BIGSERIAL PRIMARY KEY,
    building_id             BIGINT NOT NULL REFERENCES buildings(id),
    building_name           VARCHAR(50) NOT NULL,
    type                    VARCHAR(5) NOT NULL,
    fee_type                VARCHAR(20) NOT NULL,
    fee_rate                NUMERIC(6,4) NOT NULL DEFAULT 0,
    fee_amount              BIGINT,
    fee_amount_includes_vat BOOLEAN DEFAULT false,
    direction               VARCHAR(20) NOT NULL,
    settlement_day          VARCHAR(10) NOT NULL,
    period_type             VARCHAR(10) NOT NULL,
    vat                     BOOLEAN NOT NULL DEFAULT false,
    vat_mode                VARCHAR(30),
    address                 VARCHAR(200) NOT NULL DEFAULT '',
    owner_name              VARCHAR(50),
    notes                   TEXT NOT NULL DEFAULT '',
    account_type            VARCHAR(20),
    frequency               VARCHAR(10),
    include_mgmt            BOOLEAN,
    dual_account            BOOLEAN,
    moveout_owner_burden    BOOLEAN,
    has_commercial          BOOLEAN,
    cash_split              BOOLEAN,
    fee_variable            BOOLEAN,
    auto_transfer           BOOLEAN,
    dual_section            BOOLEAN,
    mgmt_fee_per_unit       BIGINT,
    dates                   JSONB,
    custom_period           JSONB,
    sub_items               JSONB,
    cost_items              JSONB,
    hybrid_rules            JSONB,
    elec_customer_map       JSONB,
    gas_code_map            JSONB,
    billing_type            VARCHAR(5),
    accounts                JSONB,
    abbr                    VARCHAR(10),
    created_at              TIMESTAMPTZ DEFAULT now(),
    UNIQUE(building_id)
);

-- ── billing_configs: 호실별 공과금 설정 (billingConfig.ts) ──
CREATE TABLE billing_configs (
    id              BIGSERIAL PRIMARY KEY,
    building_id     BIGINT NOT NULL REFERENCES buildings(id),
    room_id         BIGINT NOT NULL REFERENCES rooms(id),
    deposit_months  INT NOT NULL DEFAULT 0,
    water_fee       BIGINT NOT NULL DEFAULT 0,
    cable_fee       BIGINT NOT NULL DEFAULT 0,
    elec_amount     BIGINT NOT NULL DEFAULT 0,
    elec_start      VARCHAR(10) NOT NULL DEFAULT '',
    elec_end        VARCHAR(10) NOT NULL DEFAULT '',
    elec_price      BIGINT NOT NULL DEFAULT 0,
    elec_surcharge  BIGINT NOT NULL DEFAULT 0,
    elec_tax        BIGINT NOT NULL DEFAULT 0,
    gas_amount      BIGINT NOT NULL DEFAULT 0,
    gas_period      VARCHAR(50) NOT NULL DEFAULT '',
    gas_price       BIGINT NOT NULL DEFAULT 0,
    gas_cold_price  BIGINT NOT NULL DEFAULT 0,
    gas_tax         BIGINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(building_id, room_id)
);

-- ── billing_records: 청구 내역 (API로 생성, 시드 없음) ──
CREATE TABLE billing_records (
    id              BIGSERIAL PRIMARY KEY,
    building_id     BIGINT NOT NULL REFERENCES buildings(id),
    room_id         BIGINT NOT NULL REFERENCES rooms(id),
    contract_id     BIGINT REFERENCES contracts(id),
    period_year     INT NOT NULL,
    period_month    INT NOT NULL,
    tenant_name     VARCHAR(50) NOT NULL DEFAULT '',
    rent            BIGINT NOT NULL DEFAULT 0,
    mgmt            BIGINT NOT NULL DEFAULT 0,
    water           BIGINT NOT NULL DEFAULT 0,
    electricity     BIGINT NOT NULL DEFAULT 0,
    gas             BIGINT NOT NULL DEFAULT 0,
    internet        BIGINT NOT NULL DEFAULT 0,
    late_fee        BIGINT NOT NULL DEFAULT 0,
    total           BIGINT NOT NULL DEFAULT 0,
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    confirmed_at    TIMESTAMPTZ,
    sent_at         TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(building_id, room_id, period_year, period_month)
);
