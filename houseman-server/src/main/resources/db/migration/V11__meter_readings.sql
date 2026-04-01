CREATE TABLE meter_readings (
    id              BIGSERIAL PRIMARY KEY,
    building_id     BIGINT NOT NULL REFERENCES buildings(id),
    room_id         BIGINT REFERENCES rooms(id),
    type            VARCHAR(10) NOT NULL,  -- 'elec' | 'gas' | 'water'
    reading_date    DATE,
    reading_value   NUMERIC(12,2),
    usage           NUMERIC(12,2) NOT NULL DEFAULT 0,
    amount          INT NOT NULL DEFAULT 0,
    period_start    DATE,
    period_end      DATE,
    billing_month   VARCHAR(7),            -- 'YYYY-MM'
    customer_number VARCHAR(50),
    is_meter_replaced BOOLEAN NOT NULL DEFAULT FALSE,
    source          VARCHAR(20) NOT NULL DEFAULT 'upload',  -- 'upload' | 'manual' | 'api'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meter_readings_room ON meter_readings(room_id, type, billing_month);
CREATE INDEX idx_meter_readings_customer ON meter_readings(customer_number);
