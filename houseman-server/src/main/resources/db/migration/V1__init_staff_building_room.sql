-- ============================================================
-- V1: staff, buildings, rooms 테이블 생성
-- ============================================================

-- ── staff ──
CREATE TABLE staff (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(50)  NOT NULL,
    phone               VARCHAR(20)  NOT NULL UNIQUE,
    password            VARCHAR(100) NOT NULL,
    roles               TEXT[]       NOT NULL DEFAULT '{}',
    assigned_buildings  TEXT[]       NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ  DEFAULT now()
);

-- ── buildings ──
-- buildings.ts + buildingFloors.ts 합침
CREATE TABLE buildings (
    id              BIGSERIAL    PRIMARY KEY,
    name            VARCHAR(50)  NOT NULL UNIQUE,
    room_count      INT          NOT NULL DEFAULT 0,
    occupied_count  INT          NOT NULL DEFAULT 0,
    building_type   VARCHAR(10)  NOT NULL DEFAULT '단기',
    fee_type        VARCHAR(10)  NOT NULL DEFAULT 'pct',
    fee             NUMERIC(10,4) NOT NULL DEFAULT 0,
    fixed_fee       BIGINT       NOT NULL DEFAULT 0,
    special         TEXT,
    parking_total   INT          NOT NULL DEFAULT 0,
    -- 건물주/관리 정보 (buildingFloors.ts)
    owner_name      VARCHAR(50),
    owner_phone     VARCHAR(20),
    owner_fee       NUMERIC(10,4) DEFAULT 0,
    owner_account   VARCHAR(100),
    mgmt_start      DATE,
    address         VARCHAR(200),
    floors          JSONB,
    created_at      TIMESTAMPTZ  DEFAULT now()
);

-- ── rooms ──
-- roomMasterData.ts + buildingFloors.ts 호실 구조
CREATE TABLE rooms (
    id              BIGSERIAL    PRIMARY KEY,
    building_id     BIGINT       NOT NULL REFERENCES buildings(id),
    room_number     VARCHAR(20)  NOT NULL,
    floor_label     VARCHAR(20),
    room_type       VARCHAR(20),
    area            NUMERIC(10,1),
    base_deposit    BIGINT       DEFAULT 0,
    base_rent       BIGINT       DEFAULT 0,
    base_mgmt       BIGINT       DEFAULT 0,
    water_fee       VARCHAR(20)  DEFAULT '0',
    internet_fee    VARCHAR(20)  DEFAULT '0',
    clean_fee       BIGINT       DEFAULT 0,
    comm_fee        BIGINT       DEFAULT 0,
    elec_no         VARCHAR(30),
    gas_no          VARCHAR(30),
    created_at      TIMESTAMPTZ  DEFAULT now(),
    UNIQUE(building_id, room_number)
);

CREATE INDEX idx_rooms_building_id ON rooms(building_id);
