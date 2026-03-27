-- ============================================================
-- V7: Calendar, Vacancy, Settlement Expense DDL
-- ============================================================

-- ── calendar_events: 캘린더 이벤트 (calendarEvents.ts) ──
CREATE TABLE calendar_events (
    id              BIGSERIAL PRIMARY KEY,
    date            DATE NOT NULL,
    type            VARCHAR(10) NOT NULL,
    building_id     BIGINT REFERENCES buildings(id),
    room_id         BIGINT REFERENCES rooms(id),
    name            VARCHAR(50) NOT NULL,
    color           VARCHAR(10) NOT NULL DEFAULT '#3B82F6',
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── vacancies: 공실 관리 (vacancies.ts) ──
CREATE TABLE vacancies (
    id              BIGSERIAL PRIMARY KEY,
    building_id     BIGINT NOT NULL REFERENCES buildings(id),
    room_id         BIGINT NOT NULL REFERENCES rooms(id),
    type            VARCHAR(20) NOT NULL DEFAULT '',
    comm_broker     NUMERIC(4,2) NOT NULL DEFAULT 0,
    comm_event      VARCHAR(100) NOT NULL DEFAULT '',
    pw              VARCHAR(50) NOT NULL DEFAULT '',
    deposit         BIGINT NOT NULL DEFAULT 0,
    rent            BIGINT NOT NULL DEFAULT 0,
    nego            BIGINT NOT NULL DEFAULT 0,
    mgmt            BIGINT NOT NULL DEFAULT 0,
    water           VARCHAR(20) NOT NULL DEFAULT '',
    cable           VARCHAR(20) NOT NULL DEFAULT '',
    exit_fee        BIGINT NOT NULL DEFAULT 0,
    days            INT NOT NULL DEFAULT 0,
    status          VARCHAR(20) NOT NULL DEFAULT '점검/청소중',
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(building_id, room_id)
);

-- ── settlement_expenses: 정산 비용 내역 (settlementData.ts) ──
CREATE TABLE settlement_expenses (
    id              BIGSERIAL PRIMARY KEY,
    building_id     BIGINT NOT NULL REFERENCES buildings(id),
    room_id         BIGINT REFERENCES rooms(id),
    month           VARCHAR(7) NOT NULL,
    category        VARCHAR(20) NOT NULL,
    description     VARCHAR(200) NOT NULL DEFAULT '',
    amount          BIGINT NOT NULL DEFAULT 0,
    date            DATE NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_settlement_expenses_building_month ON settlement_expenses(building_id, month);
