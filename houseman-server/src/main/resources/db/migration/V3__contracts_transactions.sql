-- ============================================================
-- V3: 누락 건물 INSERT + contracts, past_contracts, transactions DDL
-- ============================================================

-- ── Part A: tenants.ts에서 참조하지만 V2에 없는 21개 건물 ──
INSERT INTO buildings (id, name, room_count, occupied_count, building_type, fee_type, fee, fixed_fee, special, parking_total) VALUES
(22, 'KMC코리아',       0, 0, '단기', 'pct', 0, 0, NULL, 0),
(23, '대치칼텍빌딩',    0, 0, '단기', 'pct', 0, 0, NULL, 0),
(24, '더힐하우스101동',  0, 0, '단기', 'pct', 0, 0, NULL, 0),
(25, '더힐하우스102동',  0, 0, '단기', 'pct', 0, 0, NULL, 0),
(26, '더힐하우스103동',  0, 0, '단기', 'pct', 0, 0, NULL, 0),
(27, '더힐하우스104동',  0, 0, '단기', 'pct', 0, 0, NULL, 0),
(28, '메종빌',          0, 0, '단기', 'pct', 0, 0, NULL, 0),
(29, '문화빌딩',        0, 0, '단기', 'pct', 0, 0, NULL, 0),
(30, '미진빌딩',        0, 0, '단기', 'pct', 0, 0, NULL, 0),
(31, '상건빌딩',        0, 0, '단기', 'pct', 0, 0, NULL, 0),
(32, '서우하우스',      0, 0, '단기', 'pct', 0, 0, NULL, 0),
(33, '양지빌딩',        0, 0, '단기', 'pct', 0, 0, NULL, 0),
(34, '에이스빌딩',      0, 0, '단기', 'pct', 0, 0, NULL, 0),
(35, '옥당빌라',        0, 0, '단기', 'pct', 0, 0, NULL, 0),
(36, '우영빌딩',        0, 0, '단기', 'pct', 0, 0, NULL, 0),
(37, '우진빌딩',        0, 0, '단기', 'pct', 0, 0, NULL, 0),
(38, '유석빌딩',        0, 0, '단기', 'pct', 0, 0, NULL, 0),
(39, '이례빌딩',        0, 0, '단기', 'pct', 0, 0, NULL, 0),
(40, '제이에스하우스',  0, 0, '단기', 'pct', 0, 0, NULL, 0),
(41, '집현전빌딩',      0, 0, '단기', 'pct', 0, 0, NULL, 0),
(42, '평해빌딩',        0, 0, '단기', 'pct', 0, 0, NULL, 0);

SELECT setval('buildings_id_seq', 42);

-- ── Part B: DDL ──

-- contracts (Tenant 인터페이스 1:1 매핑)
CREATE TABLE contracts (
    id              BIGSERIAL    PRIMARY KEY,
    building_id     BIGINT       NOT NULL REFERENCES buildings(id),
    room_id         BIGINT       NOT NULL REFERENCES rooms(id),
    name            VARCHAR(50)  NOT NULL,
    phone           VARCHAR(20)  NOT NULL DEFAULT '',
    rent            BIGINT       NOT NULL DEFAULT 0,
    mgmt            BIGINT       NOT NULL DEFAULT 0,
    deposit         BIGINT       NOT NULL DEFAULT 0,
    type            VARCHAR(20)  NOT NULL DEFAULT '단기',
    due             VARCHAR(10)  NOT NULL DEFAULT '',
    status          VARCHAR(10)  NOT NULL DEFAULT '정상',
    overdue         BIGINT       NOT NULL DEFAULT 0,
    move_in         DATE         NOT NULL,
    expiry          DATE         NOT NULL,
    prev_unpaid     BIGINT       NOT NULL DEFAULT 0,
    current_unpaid  BIGINT       NOT NULL DEFAULT 0,
    overdue_days    INT          NOT NULL DEFAULT 0,
    car_number      VARCHAR(30),
    car_type        VARCHAR(30),
    created_at      TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX idx_contracts_building_id ON contracts(building_id);
CREATE INDEX idx_contracts_room_id ON contracts(room_id);
CREATE INDEX idx_contracts_status ON contracts(status);

-- past_contracts (PastTenant 인터페이스 1:1 매핑)
CREATE TABLE past_contracts (
    id               BIGSERIAL    PRIMARY KEY,
    building_id      BIGINT       NOT NULL REFERENCES buildings(id),
    room_id          BIGINT       NOT NULL REFERENCES rooms(id),
    name             VARCHAR(50)  NOT NULL,
    phone            VARCHAR(20)  NOT NULL DEFAULT '',
    move_in          DATE         NOT NULL,
    move_out         DATE         NOT NULL,
    expiry           DATE,
    deposit          BIGINT       NOT NULL DEFAULT 0,
    rent             BIGINT       NOT NULL DEFAULT 0,
    mgmt             BIGINT,
    room_type        VARCHAR(20),
    due              VARCHAR(10),
    rent_day         INT,
    reason           VARCHAR(30)  NOT NULL,
    settlement       VARCHAR(30)  NOT NULL,
    settlement_date  DATE,
    clean_fee        BIGINT,
    elec_reading     BIGINT,
    gas_reading      BIGINT,
    water_reading    BIGINT,
    damage_fee       BIGINT,
    damage_desc      VARCHAR(200),
    penalty7         BIGINT,
    penalty_reason   VARCHAR(200),
    days_in_month    INT,
    used_days        INT,
    start_day        INT,
    rent_pro_rata    BIGINT,
    mgmt_pro_rata    BIGINT,
    deposit_return   BIGINT,
    total_deduct     BIGINT,
    final_refund     BIGINT,
    brokerage_fee    BIGINT,
    created_at       TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX idx_past_contracts_building_id ON past_contracts(building_id);
CREATE INDEX idx_past_contracts_room_id ON past_contracts(room_id);

-- transactions (RecentTransaction 인터페이스 매핑)
CREATE TABLE transactions (
    id              BIGSERIAL    PRIMARY KEY,
    date            DATE         NOT NULL,
    building_id     BIGINT       NOT NULL REFERENCES buildings(id),
    room_id         BIGINT       REFERENCES rooms(id),
    type            VARCHAR(10)  NOT NULL,
    category        VARCHAR(50)  NOT NULL,
    amount          BIGINT       NOT NULL,
    description     VARCHAR(200) NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX idx_transactions_building_id ON transactions(building_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
