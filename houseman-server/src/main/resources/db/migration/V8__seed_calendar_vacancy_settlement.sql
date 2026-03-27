-- ============================================================
-- V8: Seed calendar_events, vacancies, settlement_expenses
-- ============================================================

-- ── Helper functions (reuse pattern from V4) ──
CREATE OR REPLACE FUNCTION _resolve_building(p_name TEXT)
RETURNS BIGINT AS $$
DECLARE v_id BIGINT;
BEGIN
    SELECT id INTO v_id FROM buildings WHERE name = p_name;
    IF v_id IS NULL THEN
        RAISE EXCEPTION 'Building not found: %', p_name;
    END IF;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION _resolve_room(p_building TEXT, p_room TEXT)
RETURNS BIGINT AS $$
DECLARE
    v_building_id BIGINT;
    v_room_id BIGINT;
BEGIN
    SELECT id INTO v_building_id FROM buildings WHERE name = p_building;
    IF v_building_id IS NULL THEN
        RAISE EXCEPTION 'Building not found: %', p_building;
    END IF;
    SELECT id INTO v_room_id FROM rooms WHERE building_id = v_building_id AND room_number = p_room;
    IF v_room_id IS NULL THEN
        INSERT INTO rooms (building_id, room_number) VALUES (v_building_id, p_room)
        RETURNING id INTO v_room_id;
    END IF;
    RETURN v_room_id;
END;
$$ LANGUAGE plpgsql;


-- ════════════════════════════════════════════════════════════
-- Part A: calendar_events (14행)
-- ════════════════════════════════════════════════════════════

-- 계약 이벤트 (2건)
INSERT INTO calendar_events (date, type, building_id, room_id, name, color) VALUES
('2026-02-04', '계약', _resolve_building('스타빌'), _resolve_room('스타빌','105'), '황현호', '#3B82F6'),
('2026-03-05', '계약', _resolve_building('제이앤제이'), _resolve_room('제이앤제이','B01'), '윤슬기', '#3B82F6');

-- 퇴실 이벤트 (4건)
INSERT INTO calendar_events (date, type, building_id, room_id, name, color) VALUES
('2026-02-25', '퇴실', _resolve_building('스타빌'), _resolve_room('스타빌','302'), '홍윤미', '#EF4444'),
('2026-02-27', '퇴실', _resolve_building('제이앤제이'), _resolve_room('제이앤제이','301'), '차민철', '#EF4444'),
('2026-02-28', '퇴실', _resolve_building('다존하우스'), _resolve_room('다존하우스','603'), '송판석', '#EF4444'),
('2026-03-01', '퇴실', _resolve_building('아페이론'), _resolve_room('아페이론','101'), '한유진', '#EF4444');

-- 휴무 이벤트 (8건) — building_id, room_id = NULL
INSERT INTO calendar_events (date, type, building_id, room_id, name, color) VALUES
('2026-02-07', '휴무', NULL, NULL, '나호용 차장', '#8B5CF6'),
('2026-02-14', '휴무', NULL, NULL, '유은혜 부장', '#8B5CF6'),
('2026-02-21', '휴무', NULL, NULL, '유인식 과장', '#8B5CF6'),
('2026-02-28', '휴무', NULL, NULL, '나호용 차장', '#8B5CF6'),
('2026-03-07', '휴무', NULL, NULL, '유은혜 부장', '#8B5CF6'),
('2026-03-14', '휴무', NULL, NULL, '이재혁', '#8B5CF6'),
('2026-03-21', '휴무', NULL, NULL, '나호용 차장', '#8B5CF6'),
('2026-03-28', '휴무', NULL, NULL, '유은혜 부장', '#8B5CF6');


-- ════════════════════════════════════════════════════════════
-- Part B: vacancies (1행)
-- ════════════════════════════════════════════════════════════

INSERT INTO vacancies (building_id, room_id, type, comm_broker, comm_event, pw, deposit, rent, nego, mgmt, water, cable, exit_fee, days, status) VALUES
(_resolve_building('제이앤제이'), _resolve_room('제이앤제이','101'), '일반임대', 0.6, '', '', 1000, 115, 115, 0, '별도', '', 0, 0, '점검/청소중');


-- ════════════════════════════════════════════════════════════
-- Part C: settlement_expenses (12행)
-- ════════════════════════════════════════════════════════════

-- 스타빌 2026-03 (4건)
INSERT INTO settlement_expenses (building_id, room_id, month, category, description, amount, date) VALUES
(_resolve_building('스타빌'), NULL, '2026-03', 'utility', '공용전기 (3월)', 142000, '2026-03-31'),
(_resolve_building('스타빌'), NULL, '2026-03', 'cleaning', '건물 청소비 (3월)', 220000, '2026-03-31'),
(_resolve_building('스타빌'), _resolve_room('스타빌','201'), '2026-03', 'repair', '201호 수전 교체', 85000, '2026-03-12'),
(_resolve_building('스타빌'), NULL, '2026-03', 'utility', 'KT 인터넷 (3월)', 55000, '2026-03-25');

-- 스타빌 2026-02 (3건)
INSERT INTO settlement_expenses (building_id, room_id, month, category, description, amount, date) VALUES
(_resolve_building('스타빌'), NULL, '2026-02', 'repair', '403호 수도꼭지 교체', 85000, '2026-02-06'),
(_resolve_building('스타빌'), NULL, '2026-02', 'utility', '공용전기 (2월)', 127000, '2026-02-28'),
(_resolve_building('스타빌'), NULL, '2026-02', 'cleaning', '건물 청소비 (2월)', 220000, '2026-02-28');

-- 아페이론 2026-02 (3건)
INSERT INTO settlement_expenses (building_id, room_id, month, category, description, amount, date) VALUES
(_resolve_building('아페이론'), NULL, '2026-02', 'repair', '102호 보일러 수리', 350000, '2026-02-10'),
(_resolve_building('아페이론'), NULL, '2026-02', 'utility', '공용전기 (2월)', 95000, '2026-02-28'),
(_resolve_building('아페이론'), NULL, '2026-02', 'cleaning', '건물 청소비 (2월)', 180000, '2026-02-28');

-- 스타빌 2026-01 (3건)
INSERT INTO settlement_expenses (building_id, room_id, month, category, description, amount, date) VALUES
(_resolve_building('스타빌'), NULL, '2026-01', 'repair', '301호 도어락 교체', 120000, '2026-01-15'),
(_resolve_building('스타빌'), NULL, '2026-01', 'utility', '공용전기 (1월)', 115000, '2026-01-31'),
(_resolve_building('스타빌'), NULL, '2026-01', 'cleaning', '건물 청소비 (1월)', 220000, '2026-01-31');


-- ════════════════════════════════════════════════════════════
-- Part D: 헬퍼 함수 정리
-- ════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS _resolve_building(TEXT);
DROP FUNCTION IF EXISTS _resolve_room(TEXT, TEXT);
