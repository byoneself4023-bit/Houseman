CREATE TABLE late_fee_overrides (
    id         BIGSERIAL PRIMARY KEY,
    building_id BIGINT NOT NULL REFERENCES buildings(id),
    room_number VARCHAR(20) NOT NULL,
    override_type VARCHAR(20) NOT NULL DEFAULT 'exclude',  -- 'exclude' | 'discount'
    amount     INT NOT NULL DEFAULT 0,
    override_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_late_fee_overrides_building ON late_fee_overrides(building_id);
CREATE UNIQUE INDEX idx_late_fee_overrides_room ON late_fee_overrides(building_id, room_number);
