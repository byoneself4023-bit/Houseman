-- ============================================================
-- V6: Seed billing data (settlement_master + billing_configs)
-- ============================================================

-- ── Part 0: billingMaster.ts에만 있고 buildings에 아직 없는 건물 추가 ──
INSERT INTO buildings (name, room_count, occupied_count, building_type, fee_type, fee, fixed_fee, special, parking_total)
VALUES
('대치칼텍',    0, 0, '단기', 'pct', 0, 0, NULL, 0),
('더힐하우스',  0, 0, '단기', 'pct', 0, 0, NULL, 0),
('이브릿지',    0, 0, '단기', 'pct', 0, 0, NULL, 0),
('제이드하우스', 0, 0, '단기', 'pct', 0, 0, NULL, 0)
ON CONFLICT (name) DO NOTHING;

-- Helper functions
CREATE OR REPLACE FUNCTION _resolve_building(p_name TEXT)
RETURNS BIGINT AS $$
DECLARE v_id BIGINT;
BEGIN
  SELECT id INTO v_id FROM buildings WHERE name = p_name;
  IF v_id IS NULL THEN RAISE EXCEPTION 'Building not found: %', p_name; END IF;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION _resolve_room(p_building TEXT, p_room TEXT)
RETURNS BIGINT AS $$
DECLARE v_bid BIGINT; v_rid BIGINT;
BEGIN
  v_bid := _resolve_building(p_building);
  SELECT id INTO v_rid FROM rooms WHERE building_id = v_bid AND room_number = p_room;
  IF v_rid IS NULL THEN
    INSERT INTO rooms (building_id, room_number, floor_label, room_type)
    VALUES (v_bid, p_room, '', '원룸') RETURNING id INTO v_rid;
  END IF;
  RETURN v_rid;
END;
$$ LANGUAGE plpgsql;

-- ── Part A: settlement_master ──
INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('제이앤제이'), '제이앤제이',
  'A', 'pct', 0,
  NULL, false,
  'hm_to_owner', '15', 'mid',
  false, NULL,
  '서울 관악구 제이앤제이빌라', '박시현', '수수료 없음. 누나 계좌로 정산.',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '{"01-1331-7839":[{"b":"제이앤제이","r":"B01"}],"01-1331-7840":[{"b":"제이앤제이","r":"201"}],"01-1331-7841":[{"b":"제이앤제이","r":"301"}],"01-1331-7842":[{"b":"제이앤제이","r":"401"}]}'::jsonb,
  '{"제이앤제이B01":{"b":"제이앤제이","r":"B01"},"제이앤제이201":{"b":"제이앤제이","r":"201"},"제이앤제이301":{"b":"제이앤제이","r":"301"},"제이앤제이401":{"b":"제이앤제이","r":"401"}}'::jsonb,
  'A', '{"owner":null,"manager":{"bank":"하나","account":"225-910048-15704","holder":"박종호(하우스맨)"}}'::jsonb, 'JJ'
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('스타빌'), '스타빌',
  'A', 'pct', 0.05,
  NULL, false,
  'hm_to_owner', '말일', 'month',
  false, NULL,
  '서울 관악구 봉천동 1549-16', '박용상', '',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '{"01-1015-7856":[{"b":"스타빌","r":"101","share":0.5},{"b":"스타빌","r":"102","share":0.5}],"01-1015-7857":[{"b":"스타빌","r":"103","share":0.5},{"b":"스타빌","r":"105","share":0.5}],"01-1015-7858":[{"b":"스타빌","r":"201","share":0.5},{"b":"스타빌","r":"202","share":0.5}],"01-1015-7859":[{"b":"스타빌","r":"203","share":0.5},{"b":"스타빌","r":"205","share":0.5}],"01-1015-7860":[{"b":"스타빌","r":"301","share":0.5},{"b":"스타빌","r":"302","share":0.5}],"01-1015-7861":[{"b":"스타빌","r":"303","share":0.5},{"b":"스타빌","r":"305","share":0.5}],"01-1015-7862":[{"b":"스타빌","r":"401","share":0.5},{"b":"스타빌","r":"402","share":0.5}],"01-1015-7863":[{"b":"스타빌","r":"403","share":0.5},{"b":"스타빌","r":"405","share":0.5}]}'::jsonb,
  '{"스타빌101":{"b":"스타빌","r":"101"},"스타빌102":{"b":"스타빌","r":"102"},"스타빌103":{"b":"스타빌","r":"103"},"스타빌105":{"b":"스타빌","r":"105"},"스타빌201":{"b":"스타빌","r":"201"},"스타빌202":{"b":"스타빌","r":"202"},"스타빌203":{"b":"스타빌","r":"203"},"스타빌205":{"b":"스타빌","r":"205"},"스타빌301":{"b":"스타빌","r":"301"},"스타빌302":{"b":"스타빌","r":"302"},"스타빌303":{"b":"스타빌","r":"303"},"스타빌305":{"b":"스타빌","r":"305"},"스타빌401":{"b":"스타빌","r":"401"},"스타빌402":{"b":"스타빌","r":"402"},"스타빌403":{"b":"스타빌","r":"403"},"스타빌405":{"b":"스타빌","r":"405"}}'::jsonb,
  'B', '{"owner":{"bank":"국민","account":"012-34-5678901","holder":"스타빌건물주"},"manager":{"bank":"하나","account":"225-910048-15704","holder":"박종호(하우스맨)"}}'::jsonb, 'SB'
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('아페이론'), '아페이론',
  'A', 'pct', 0.05,
  NULL, false,
  'hm_to_owner', '말일', 'month',
  true, NULL,
  '서울 관악구 아페이론', NULL, '예치금 별도 보관',
  NULL, 'twice',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '[22,29]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  '{"02-3110-5501":[{"b":"아페이론","r":"101"}],"02-3110-5502":[{"b":"아페이론","r":"102"}],"02-3110-5503":[{"b":"아페이론","r":"103"}],"02-3110-5504":[{"b":"아페이론","r":"104"}],"02-3110-5505":[{"b":"아페이론","r":"105"}],"02-3110-5506":[{"b":"아페이론","r":"201"}],"02-3110-5507":[{"b":"아페이론","r":"202"}],"02-3110-5508":[{"b":"아페이론","r":"203"}],"02-3110-5509":[{"b":"아페이론","r":"204"}],"02-3110-5510":[{"b":"아페이론","r":"205"}]}'::jsonb,
  '{"아페이론101":{"b":"아페이론","r":"101"},"아페이론102":{"b":"아페이론","r":"102"},"아페이론103":{"b":"아페이론","r":"103"},"아페이론104":{"b":"아페이론","r":"104"},"아페이론105":{"b":"아페이론","r":"105"},"아페이론201":{"b":"아페이론","r":"201"},"아페이론202":{"b":"아페이론","r":"202"},"아페이론203":{"b":"아페이론","r":"203"},"아페이론204":{"b":"아페이론","r":"204"},"아페이론205":{"b":"아페이론","r":"205"}}'::jsonb,
  'B', '{"owner":{"bank":"신한","account":"110-123-456789","holder":"아페이론건물주"},"manager":{"bank":"하나","account":"225-910048-15704","holder":"박종호(하우스맨)"}}'::jsonb, 'AP'
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('다존하우스'), '다존하우스',
  'A', 'pct', 0.1,
  NULL, false,
  'hm_to_owner', '21', 'month',
  true, NULL,
  '서울 관악구 다존하우스', NULL, '관리비 분리, 월세만 10%',
  NULL, NULL,
  false,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '{"다존하우스201":{"b":"다존하우스","r":"201"},"다존하우스202":{"b":"다존하우스","r":"202"},"다존하우스203":{"b":"다존하우스","r":"203"},"다존하우스205":{"b":"다존하우스","r":"205"},"다존하우스206":{"b":"다존하우스","r":"206"},"다존하우스207":{"b":"다존하우스","r":"207"},"다존하우스208":{"b":"다존하우스","r":"208"},"다존하우스209":{"b":"다존하우스","r":"209"},"다존하우스210":{"b":"다존하우스","r":"210"},"다존하우스301":{"b":"다존하우스","r":"301"},"다존하우스302":{"b":"다존하우스","r":"302"},"다존하우스303":{"b":"다존하우스","r":"303"},"다존하우스305":{"b":"다존하우스","r":"305"},"다존하우스306":{"b":"다존하우스","r":"306"},"다존하우스307":{"b":"다존하우스","r":"307"},"다존하우스308":{"b":"다존하우스","r":"308"},"다존하우스309":{"b":"다존하우스","r":"309"},"다존하우스310":{"b":"다존하우스","r":"310"},"다존하우스501":{"b":"다존하우스","r":"501"},"다존하우스502":{"b":"다존하우스","r":"502"},"다존하우스503":{"b":"다존하우스","r":"503"},"다존하우스505":{"b":"다존하우스","r":"505"},"다존하우스506":{"b":"다존하우스","r":"506"},"다존하우스507":{"b":"다존하우스","r":"507"},"다존하우스508":{"b":"다존하우스","r":"508"},"다존하우스509":{"b":"다존하우스","r":"509"},"다존하우스510":{"b":"다존하우스","r":"510"},"다존하우스601":{"b":"다존하우스","r":"601"},"다존하우스602":{"b":"다존하우스","r":"602"},"다존하우스603":{"b":"다존하우스","r":"603"},"다존하우스605":{"b":"다존하우스","r":"605"},"다존하우스606":{"b":"다존하우스","r":"606"},"다존하우스607":{"b":"다존하우스","r":"607"}}'::jsonb,
  'A', NULL, 'DZ'
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('포유빌'), '포유빌',
  'A', 'pct', 0.06,
  NULL, false,
  'hm_to_owner', '말일', 'month',
  true, NULL,
  '서울 관악구 포유빌', NULL, '정산계좌 2개',
  NULL, 'twice',
  NULL,
  true,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '[1,15]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '{"포유빌101":{"b":"포유빌","r":"101"},"포유빌201":{"b":"포유빌","r":"201"},"포유빌202":{"b":"포유빌","r":"202"},"포유빌301":{"b":"포유빌","r":"301"},"포유빌302":{"b":"포유빌","r":"302"},"포유빌401":{"b":"포유빌","r":"401"},"포유빌402":{"b":"포유빌","r":"402"},"포유빌403":{"b":"포유빌","r":"403"},"포유빌501":{"b":"포유빌","r":"501"}}'::jsonb,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('미래홈'), '미래홈',
  'A', 'pct', 0.1,
  NULL, false,
  'hm_to_owner', '말일', 'month',
  true, NULL,
  '서울 관악구 미래홈', NULL, '전세혼합, 중개수수료 캡쳐 필수첨부',
  NULL, NULL,
  true,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '{"미래홈101":{"b":"미래홈","r":"101"},"미래홈102":{"b":"미래홈","r":"102"},"미래홈103":{"b":"미래홈","r":"103"},"미래홈104":{"b":"미래홈","r":"104"},"미래홈105":{"b":"미래홈","r":"105"},"미래홈106":{"b":"미래홈","r":"106"},"미래홈107":{"b":"미래홈","r":"107"},"미래홈201":{"b":"미래홈","r":"201"},"미래홈202":{"b":"미래홈","r":"202"},"미래홈203":{"b":"미래홈","r":"203"},"미래홈204":{"b":"미래홈","r":"204"},"미래홈205":{"b":"미래홈","r":"205"},"미래홈301":{"b":"미래홈","r":"301"},"미래홈302":{"b":"미래홈","r":"302"},"미래홈303":{"b":"미래홈","r":"303"},"미래홈304":{"b":"미래홈","r":"304"},"미래홈305":{"b":"미래홈","r":"305"},"미래홈401":{"b":"미래홈","r":"401"},"미래홈402":{"b":"미래홈","r":"402"},"미래홈403":{"b":"미래홈","r":"403"},"미래홈404":{"b":"미래홈","r":"404"},"미래홈405":{"b":"미래홈","r":"405"},"미래홈501":{"b":"미래홈","r":"501"}}'::jsonb,
  'A', NULL, 'MR'
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('메종빌'), '메종빌',
  'A', 'pct', 0.06,
  NULL, false,
  'hm_to_owner', '말일', 'month',
  false, NULL,
  '서울 관악구 메종빌', NULL, '층별파일분리(1-4/5-6), 예치금 동별 차이',
  NULL, 'twice',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '[15,"말일"]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '{"메종빌101":{"b":"메종빌","r":"101"},"메종빌201":{"b":"메종빌","r":"201"},"메종빌202":{"b":"메종빌","r":"202"},"메종빌203":{"b":"메종빌","r":"203"},"메종빌301":{"b":"메종빌","r":"301"},"메종빌302":{"b":"메종빌","r":"302"},"메종빌303":{"b":"메종빌","r":"303"},"메종빌401":{"b":"메종빌","r":"401"},"메종빌402":{"b":"메종빌","r":"402"},"메종빌403":{"b":"메종빌","r":"403"},"메종빌501":{"b":"메종빌","r":"501"},"메종빌502":{"b":"메종빌","r":"502"},"메종빌503":{"b":"메종빌","r":"503"},"메종빌601":{"b":"메종빌","r":"601"},"메종빌602":{"b":"메종빌","r":"602"},"메종빌603":{"b":"메종빌","r":"603"}}'::jsonb,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('리트코하우스'), '리트코하우스',
  'A', 'pct', 0.06,
  NULL, false,
  'hm_to_owner', '말일', 'month',
  true, NULL,
  '서울 관악구 리트코하우스', NULL, '주차요금 별도 컬럼',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '{"리트코하우스501":{"b":"리트코하우스","r":"501"},"리트코하우스502":{"b":"리트코하우스","r":"502"},"리트코하우스503":{"b":"리트코하우스","r":"503"},"리트코하우스504":{"b":"리트코하우스","r":"504"},"리트코하우스505":{"b":"리트코하우스","r":"505"},"리트코하우스506":{"b":"리트코하우스","r":"506"},"리트코하우스601":{"b":"리트코하우스","r":"601"},"리트코하우스602":{"b":"리트코하우스","r":"602"},"리트코하우스603":{"b":"리트코하우스","r":"603"},"리트코하우스604":{"b":"리트코하우스","r":"604"},"리트코하우스605":{"b":"리트코하우스","r":"605"},"리트코하우스606":{"b":"리트코하우스","r":"606"},"리트코하우스701":{"b":"리트코하우스","r":"701"},"리트코하우스702":{"b":"리트코하우스","r":"702"},"리트코하우스703":{"b":"리트코하우스","r":"703"},"리트코하우스704":{"b":"리트코하우스","r":"704"},"리트코하우스705":{"b":"리트코하우스","r":"705"},"리트코하우스706":{"b":"리트코하우스","r":"706"}}'::jsonb,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('모닝빌'), '모닝빌',
  'A', 'pct', 0.063,
  NULL, false,
  'hm_to_owner', '말일', 'custom',
  true, NULL,
  '서울 관악구 모닝빌', NULL, '관리비 없음',
  NULL, 'twice',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '[20,"말일"]'::jsonb,
  '{"startDay":20,"endDay":-1}'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  '{"모닝빌201":{"b":"모닝빌","r":"201"},"모닝빌202":{"b":"모닝빌","r":"202"},"모닝빌203":{"b":"모닝빌","r":"203"},"모닝빌204":{"b":"모닝빌","r":"204"},"모닝빌205":{"b":"모닝빌","r":"205"},"모닝빌301":{"b":"모닝빌","r":"301"},"모닝빌302":{"b":"모닝빌","r":"302"},"모닝빌304":{"b":"모닝빌","r":"304"},"모닝빌305":{"b":"모닝빌","r":"305"},"모닝빌401":{"b":"모닝빌","r":"401"},"모닝빌402":{"b":"모닝빌","r":"402"},"모닝빌403":{"b":"모닝빌","r":"403"},"모닝빌404":{"b":"모닝빌","r":"404"},"모닝빌405":{"b":"모닝빌","r":"405"}}'::jsonb,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('에덴빌'), '에덴빌',
  'A', 'pct', 0.05,
  NULL, false,
  'hm_to_owner', '말일', 'month',
  false, NULL,
  '서울 관악구 에덴빌', NULL, '전세혼합, 무상AS기록',
  NULL, 'twice',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '[1,20]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '{"에덴빌102":{"b":"에덴빌","r":"102"},"에덴빌201":{"b":"에덴빌","r":"201"},"에덴빌202":{"b":"에덴빌","r":"202"},"에덴빌203":{"b":"에덴빌","r":"203"},"에덴빌204":{"b":"에덴빌","r":"204"},"에덴빌301":{"b":"에덴빌","r":"301"},"에덴빌302":{"b":"에덴빌","r":"302"},"에덴빌303":{"b":"에덴빌","r":"303"},"에덴빌304":{"b":"에덴빌","r":"304"}}'::jsonb,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('지앤지2'), '지앤지2',
  'A', 'pct', 0.045,
  NULL, false,
  'hm_to_owner', '말일', 'month',
  false, NULL,
  '서울 관악구 지앤지2', NULL, '7일패널티 컬럼, 정산계좌 2개',
  NULL, 'twice',
  NULL,
  true,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '[10,25]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '{"지앤지2201":{"b":"지앤지2","r":"201"},"지앤지2202":{"b":"지앤지2","r":"202"},"지앤지2203":{"b":"지앤지2","r":"203"},"지앤지2204":{"b":"지앤지2","r":"204"},"지앤지2301":{"b":"지앤지2","r":"301"},"지앤지2302":{"b":"지앤지2","r":"302"},"지앤지2303":{"b":"지앤지2","r":"303"},"지앤지2304":{"b":"지앤지2","r":"304"},"지앤지2401":{"b":"지앤지2","r":"401"}}'::jsonb,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('토브미하우스'), '토브미하우스',
  'A', 'pct', 0.05,
  NULL, false,
  'hm_to_owner', '말일', 'month',
  true, 'end_of_month_only',
  '서울 관악구 토브미하우스', NULL, '관리비 별도열, VAT 말일에만 반영',
  NULL, 'twice',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '[15,"말일"]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '{"토브미하우스201":{"b":"토브미하우스","r":"201"},"토브미하우스202":{"b":"토브미하우스","r":"202"},"토브미하우스203":{"b":"토브미하우스","r":"203"},"토브미하우스301":{"b":"토브미하우스","r":"301"},"토브미하우스302":{"b":"토브미하우스","r":"302"},"토브미하우스303":{"b":"토브미하우스","r":"303"},"토브미하우스401":{"b":"토브미하우스","r":"401"},"토브미하우스402":{"b":"토브미하우스","r":"402"}}'::jsonb,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('서우하우스'), '서우하우스',
  'A', 'pct', 0.06,
  NULL, false,
  'hm_to_owner', '말일', 'month',
  false, NULL,
  '서울 관악구 서우하우스', NULL, '현금분할수령(비율 전화확인), 공용전기 50%, 예치금 2천만',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '{"서우하우스301":{"b":"서우하우스","r":"301"},"서우하우스302":{"b":"서우하우스","r":"302"},"서우하우스401":{"b":"서우하우스","r":"401"},"서우하우스402":{"b":"서우하우스","r":"402"}}'::jsonb,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('모던라이프'), '모던라이프',
  'A', 'pct', 0.05,
  NULL, false,
  'hm_to_owner', '말일', 'month',
  false, NULL,
  '서울 관악구 모던라이프', NULL, '',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '{"모던라이프201":{"b":"모던라이프","r":"201"},"모던라이프202":{"b":"모던라이프","r":"202"},"모던라이프203":{"b":"모던라이프","r":"203"},"모던라이프204":{"b":"모던라이프","r":"204"},"모던라이프301":{"b":"모던라이프","r":"301"},"모던라이프302":{"b":"모던라이프","r":"302"},"모던라이프303":{"b":"모던라이프","r":"303"},"모던라이프304":{"b":"모던라이프","r":"304"},"모던라이프401":{"b":"모던라이프","r":"401"},"모던라이프402":{"b":"모던라이프","r":"402"},"모던라이프403":{"b":"모던라이프","r":"403"},"모던라이프404":{"b":"모던라이프","r":"404"},"모던라이프501":{"b":"모던라이프","r":"501"},"모던라이프502":{"b":"모던라이프","r":"502"},"모던라이프503":{"b":"모던라이프","r":"503"},"모던라이프601":{"b":"모던라이프","r":"601"}}'::jsonb,
  'A', NULL, 'ML'
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('와이원빈티지'), '와이원빈티지',
  'A', 'pct', 0.06,
  NULL, false,
  'hm_to_owner', '말일', 'month',
  false, NULL,
  '서울 관악구 와이원빈티지', NULL, '건물주계좌 직접입금, 수수료만 HM에게',
  'owner', NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '{"와이원빈티지201":{"b":"와이원빈티지","r":"201"},"와이원빈티지202":{"b":"와이원빈티지","r":"202"},"와이원빈티지203":{"b":"와이원빈티지","r":"203"},"와이원빈티지204":{"b":"와이원빈티지","r":"204"},"와이원빈티지301":{"b":"와이원빈티지","r":"301"},"와이원빈티지302":{"b":"와이원빈티지","r":"302"},"와이원빈티지303":{"b":"와이원빈티지","r":"303"},"와이원빈티지304":{"b":"와이원빈티지","r":"304"},"와이원빈티지401":{"b":"와이원빈티지","r":"401"},"와이원빈티지402":{"b":"와이원빈티지","r":"402"},"와이원빈티지403":{"b":"와이원빈티지","r":"403"},"와이원빈티지404":{"b":"와이원빈티지","r":"404"},"와이원빈티지501":{"b":"와이원빈티지","r":"501"},"와이원빈티지502":{"b":"와이원빈티지","r":"502"}}'::jsonb,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('굿모닝빌'), '굿모닝빌',
  'A', 'pct', 0.06,
  NULL, false,
  'hm_to_owner', '말일', 'month',
  false, NULL,
  '서울 관악구 굿모닝빌', NULL, '건물주계좌, 수도/KT 별도열, 퇴실정산 건물주부담',
  'owner', NULL,
  true,
  NULL,
  true,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '{"굿모닝빌201":{"b":"굿모닝빌","r":"201"},"굿모닝빌202":{"b":"굿모닝빌","r":"202"},"굿모닝빌203":{"b":"굿모닝빌","r":"203"},"굿모닝빌204":{"b":"굿모닝빌","r":"204"},"굿모닝빌301":{"b":"굿모닝빌","r":"301"},"굿모닝빌302":{"b":"굿모닝빌","r":"302"},"굿모닝빌303":{"b":"굿모닝빌","r":"303"},"굿모닝빌304":{"b":"굿모닝빌","r":"304"},"굿모닝빌401":{"b":"굿모닝빌","r":"401"},"굿모닝빌402":{"b":"굿모닝빌","r":"402"},"굿모닝빌501":{"b":"굿모닝빌","r":"501"},"굿모닝빌502":{"b":"굿모닝빌","r":"502"}}'::jsonb,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('한스텔'), '한스텔',
  'A', 'pct', 0.05,
  NULL, false,
  'hm_to_owner', '말일', 'month',
  false, NULL,
  '서울 관악구 한스텔', NULL, '첨부 필수',
  'owner', NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '{"한스텔101":{"b":"한스텔","r":"101"},"한스텔102":{"b":"한스텔","r":"102"},"한스텔103":{"b":"한스텔","r":"103"},"한스텔104":{"b":"한스텔","r":"104"},"한스텔201":{"b":"한스텔","r":"201"},"한스텔202":{"b":"한스텔","r":"202"},"한스텔203":{"b":"한스텔","r":"203"},"한스텔204":{"b":"한스텔","r":"204"},"한스텔301":{"b":"한스텔","r":"301"},"한스텔302":{"b":"한스텔","r":"302"},"한스텔303":{"b":"한스텔","r":"303"},"한스텔304":{"b":"한스텔","r":"304"},"한스텔B01":{"b":"한스텔","r":"B01"},"한스텔B02":{"b":"한스텔","r":"B02"},"한스텔B03":{"b":"한스텔","r":"B03"},"한스텔B04":{"b":"한스텔","r":"B04"}}'::jsonb,
  'A', NULL, 'HS'
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('모던하우스'), '모던하우스',
  'A', 'pct', 0.09,
  NULL, false,
  'hm_to_owner', '20', 'month',
  false, NULL,
  '서울 관악구 모던하우스', NULL, '건물주계좌, 별도퇴실정산서, 오입금처리',
  'owner', NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '{"모던하우스201":{"b":"모던하우스","r":"201"},"모던하우스202":{"b":"모던하우스","r":"202"},"모던하우스203":{"b":"모던하우스","r":"203"},"모던하우스204":{"b":"모던하우스","r":"204"},"모던하우스205":{"b":"모던하우스","r":"205"},"모던하우스301":{"b":"모던하우스","r":"301"},"모던하우스302":{"b":"모던하우스","r":"302"},"모던하우스303":{"b":"모던하우스","r":"303"},"모던하우스304":{"b":"모던하우스","r":"304"},"모던하우스305":{"b":"모던하우스","r":"305"},"모던하우스401":{"b":"모던하우스","r":"401"},"모던하우스402":{"b":"모던하우스","r":"402"},"모던하우스403":{"b":"모던하우스","r":"403"},"모던하우스404":{"b":"모던하우스","r":"404"},"모던하우스405":{"b":"모던하우스","r":"405"},"모던하우스501":{"b":"모던하우스","r":"501"},"모던하우스502":{"b":"모던하우스","r":"502"},"모던하우스503":{"b":"모던하우스","r":"503"},"모던하우스504":{"b":"모던하우스","r":"504"}}'::jsonb,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('W하우스'), 'W하우스',
  'A', 'pct', 0.06,
  NULL, false,
  'hm_to_owner', '말일', 'month',
  false, NULL,
  '서울 강남구 W하우스', NULL, '근생+단기 혼합, 층별계좌분리(1-2층 건물주/3-5층 HM)',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '{"W하우스301":{"b":"W하우스","r":"301"},"W하우스302":{"b":"W하우스","r":"302"},"W하우스303":{"b":"W하우스","r":"303"},"W하우스304":{"b":"W하우스","r":"304"},"W하우스305":{"b":"W하우스","r":"305"},"W하우스401":{"b":"W하우스","r":"401"},"W하우스402":{"b":"W하우스","r":"402"},"W하우스403":{"b":"W하우스","r":"403"},"W하우스501":{"b":"W하우스","r":"501"},"W하우스502":{"b":"W하우스","r":"502"},"W하우스503":{"b":"W하우스","r":"503"},"W하우스601":{"b":"W하우스","r":"601"},"W하우스602":{"b":"W하우스","r":"602"},"W하우스603":{"b":"W하우스","r":"603"},"W하우스7층":{"b":"W하우스","r":"7층"}}'::jsonb,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('제이드하우스'), '제이드하우스',
  'F', 'fixed', 0,
  1100000, true,
  'hm_to_owner', '말일', 'month',
  false, NULL,
  '서울 관악구 옥당빌라', NULL, '건물운영대행비 110만(VAT포함), 별도 임대현황표, 계산서 발행 필수',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('제이에스하우스'), '제이에스하우스',
  'F', 'hybrid', 0.06,
  400000, false,
  'hm_to_owner', '말일', 'month',
  false, NULL,
  '서울 관악구 제이에스하우스', NULL, '근생 40만 고정 + 단기 6% 이중구조, 상/하 2단분리',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '[{"unitType":"commercial","feeType":"fixed","feeAmount":400000},{"unitType":"short_term","feeType":"pct","feeRate":0.06}]'::jsonb,
  NULL,
  '{"제이에스하우스501":{"b":"제이에스하우스","r":"501"},"제이에스하우스502":{"b":"제이에스하우스","r":"502"},"제이에스하우스503":{"b":"제이에스하우스","r":"503"},"제이에스하우스505":{"b":"제이에스하우스","r":"505"},"제이에스하우스601":{"b":"제이에스하우스","r":"601"},"제이에스하우스602":{"b":"제이에스하우스","r":"602"}}'::jsonb,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('신림프리미어'), '신림프리미어',
  'S', 'salary', 0,
  1500000, false,
  'owner_to_hm', '말일', 'month',
  true, NULL,
  '서울 관악구 신림프리미어', NULL, '주택 월급형 (150만+α), 주차승강기 8만 포함, 주말퇴실정산, 주차전용임차인',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '[{"name":"주차승강기 관리비","amount":80000,"vendor":""}]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('우영빌딩'), '우영빌딩',
  'S', 'salary', 0,
  600000, false,
  'owner_to_hm', '말일', 'month',
  true, NULL,
  '서울 관악구 우영빌딩', NULL, '근생',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '[{"name":"건물 청소비","amount":220000,"vendor":""},{"name":"소방안전관리비","amount":90000,"vendor":""},{"name":"승강기 유지보수","amount":180000,"vendor":""},{"name":"전기안전관리비","amount":120000,"vendor":""}]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('우진빌딩'), '우진빌딩',
  'S', 'salary', 0,
  400000, false,
  'owner_to_hm', '말일', 'month',
  true, NULL,
  '서울 관악구 우진빌딩', NULL, '근생, 청구서 겸용, 공과금 배분비율표',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '[{"name":"건물 청소비","amount":454000,"vendor":"크린하우스"}]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('대치칼텍'), '대치칼텍',
  'S', 'salary', 0,
  500000, false,
  'owner_to_hm', '말일', 'month',
  true, NULL,
  '서울 강남구 대치칼텍빌딩', NULL, '근생, 단순',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('서연빌'), '서연빌',
  'S', 'salary', 0,
  500000, false,
  'owner_to_hm', '말일', 'month',
  true, NULL,
  '서울 관악구 서연빌', NULL, '근생+주거혼합, 전세비중높음, 별도퇴실정산서',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('문화빌딩'), '문화빌딩',
  'S', 'salary', 0,
  900000, false,
  'owner_to_hm', '말일', 'month',
  true, NULL,
  '서울 관악구 문화빌딩', NULL, '근생, 청구서 폴더 있음',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('집현전빌딩'), '집현전빌딩',
  'S', 'salary', 0,
  600000, false,
  'owner_to_hm', '말일', 'month',
  true, NULL,
  '서울 관악구 집현전빌딩', NULL, '근생(학원다수)',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '[{"name":"건물 청소비","amount":300000,"vendor":""}]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('어반그레이'), '어반그레이',
  'S', 'salary', 0,
  370000, false,
  'owner_to_hm', '말일', 'month',
  true, NULL,
  '경기 남양주시 어반그레이', NULL, '근생, 입주수에 따라 수수료 변동, 청소 포함',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('이례빌딩'), '이례빌딩',
  'S', 'salary', 0,
  800000, false,
  'owner_to_hm', '5', 'month',
  true, NULL,
  '서울 관악구 이례빌딩', NULL, '근생, 옥상통신시설, 미납4컬럼분리, 청구서 있음',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('KMC코리아'), 'KMC코리아',
  'S', 'salary', 0,
  1200000, false,
  'owner_to_hm', '5', 'month',
  true, NULL,
  '서울 마포구 KMC코리아', NULL, '근생대형(임대료 8,951만), 증빙자료 필수첨부',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '[{"name":"건물 청소비","amount":500000,"vendor":"부자청소"},{"name":"소방안전관리비","amount":150000,"vendor":""},{"name":"전기안전관리비","amount":140000,"vendor":"신한전기기술단"},{"name":"기계식주차장 유지보수","amount":220000,"vendor":"(주)앱스"},{"name":"엘리베이터 유지보수","amount":200000,"vendor":"TK엘리베이터"}]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('양지빌딩'), '양지빌딩',
  'S', 'salary', 0,
  770000, true,
  'owner_to_hm', '1', 'month',
  false, NULL,
  '서울 관악구 양지빌딩', NULL, '근생, 자동이체(정산서합계 0원)',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('상건빌딩'), '상건빌딩',
  'S', 'salary', 0,
  600000, false,
  'owner_to_hm', '5', 'month',
  true, NULL,
  '서울 중구 을지로 상건빌딩', NULL, '근생대형, 전기/수도 별도 컬럼, 대규모미납',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '[{"name":"건물 청소비","amount":250000,"vendor":"크린하우스"}]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('미진빌딩'), '미진빌딩',
  'S', 'salary', 0,
  650000, false,
  'owner_to_hm', '5', 'month',
  true, NULL,
  '서울 중구 을지로 미진빌딩', NULL, '근생, 전기/수도 별도 컬럼',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '[{"name":"건물 청소비","amount":200000,"vendor":""},{"name":"소방안전관리비","amount":50000,"vendor":""}]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('유석빌딩'), '유석빌딩',
  'S', 'salary', 0,
  600000, false,
  'owner_to_hm', '5', 'month',
  true, NULL,
  '서울 중구 신당동 유석빌딩', NULL, '근생+주거, 영수증시트 별도',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('에이스빌딩'), '에이스빌딩',
  'S', 'salary', 0,
  1400000, false,
  'owner_to_hm', '5', 'month',
  true, NULL,
  '서울 구로구 에이스빌딩', NULL, '근생대형(보증금15.4억), 관리비 호실별 상이',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '[{"name":"건물 청소비","amount":513000,"vendor":"부자청소"},{"name":"전기안전관리비","amount":200000,"vendor":"신한전기기술단"},{"name":"승강기 유지보수","amount":90000,"vendor":"서울파킹"},{"name":"주차장치 유지보수","amount":120000,"vendor":"서울파킹"},{"name":"소방안전관리비","amount":200000,"vendor":"더세이프"}]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('평해빌딩'), '평해빌딩',
  'S', 'salary', 0,
  750000, false,
  'owner_to_hm', '말일', 'month',
  true, NULL,
  '서울 관악구 평해빌딩', NULL, '근생, 수도검침표 별도 관리',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('더힐하우스'), '더힐하우스',
  'D', 'collection', 0,
  NULL, false,
  'hm_to_owner', '말일', 'month',
  false, NULL,
  '서울 관악구 더힐하우스', NULL, '4개동 44세대, 관리비 수금→비용 차감, 미납 매트릭스',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  90000,
  NULL,
  NULL,
  NULL,
  '[{"name":"하우스맨 기본 관리비","amount":1188000},{"name":"건물 청소","amount":900000},{"name":"엘리베이터","amount":320000},{"name":"화재/승강기 보험","amount":94800},{"name":"전기 안전점검","amount":80000},{"name":"CCTV인터넷 요금","amount":55000},{"name":"엘리베이터 통신 요금","amount":15540}]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('이브릿지'), '이브릿지',
  'X', 'fixed', 0,
  275000, false,
  'owner_to_hm', '말일', 'month',
  false, NULL,
  '', NULL, '시설물점검 대행만, 정산서 없음, 월2회 방문+보고서',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL, NULL, NULL
);

INSERT INTO settlement_master (building_id, building_name, type, fee_type, fee_rate, fee_amount, fee_amount_includes_vat, direction, settlement_day, period_type, vat, vat_mode, address, owner_name, notes, account_type, frequency, include_mgmt, dual_account, moveout_owner_burden, has_commercial, cash_split, fee_variable, auto_transfer, dual_section, mgmt_fee_per_unit, dates, custom_period, sub_items, cost_items, hybrid_rules, elec_customer_map, gas_code_map, billing_type, accounts, abbr)
VALUES (
  _resolve_building('풍림빌딩'), '풍림빌딩',
  'X', 'none', 0,
  NULL, false,
  'none', '말일', 'month',
  false, NULL,
  '서울 관악구 풍림빌딩', NULL, '청구서 작성 대행만, 임차인별 시트, 공과금 배분비율표',
  NULL, NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL, NULL, NULL
);


-- ── Part B: billing_configs ──
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('제이앤제이'), _resolve_room('제이앤제이', 'B01'), 5, 25000, 25000, 22760, '10/12', '11/11', 2575, 2719, 144, 30420, '12.20~01.19', 2481, 2509, 28);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('제이앤제이'), _resolve_room('제이앤제이', '201'), 3, 15000, 25000, 41020, '10/12', '11/11', 6085, 6390, 305, 147670, '12.20~01.19', 1451, 1592, 141);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('제이앤제이'), _resolve_room('제이앤제이', '301'), 21, 25000, 25000, 15520, '10/12', '11/11', 6260, 6356, 96, 247280, '12.20~01.19', 2647, 2884, 237);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('제이앤제이'), _resolve_room('제이앤제이', '401'), 26, 30000, 25000, 20050, '10/12', '11/11', 29853, 29979, 126, 182950, '12.20~01.19', 4785, 4960, 175);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('스타빌'), _resolve_room('스타빌', '101'), 15, 25000, 25000, 30470, '10/08', '11/07', 1826, 2021, 195, 61530, '12.09~01.08', 678, 736, 58);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('스타빌'), _resolve_room('스타빌', '102'), 28, 25000, 25000, 30470, '10/08', '11/07', 1826, 2021, 195, 68790, '12.09~01.08', 1606, 1671, 65);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('스타빌'), _resolve_room('스타빌', '103'), 18, 25000, 25000, 36890, '10/08', '11/07', 1995, 2214, 219, 80200, '12.09~01.08', 1058, 1134, 76);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('스타빌'), _resolve_room('스타빌', '105'), 4, 25000, 25000, 36890, '10/08', '11/07', 1995, 2214, 219, 45960, '11.09~12.08', 1449, 1492, 43);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('스타빌'), _resolve_room('스타빌', '201'), 4, 20000, 25000, 28960, '10/08', '11/07', 1926, 2111, 185, 87460, '12.09~01.08', 1254, 1337, 83);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('스타빌'), _resolve_room('스타빌', '202'), 29, 25000, 25000, 28960, '10/08', '11/07', 1926, 2111, 185, 36760, '01.09~02.08', 748, 782, 34);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('스타빌'), _resolve_room('스타빌', '203'), 27, 25000, 25000, 24280, '10/08', '11/07', 1997, 2151, 154, 38840, '01.09~02.08', 1489, 1525, 36);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('스타빌'), _resolve_room('스타빌', '205'), 11, 20000, 25000, 24280, '10/08', '11/07', 1997, 2151, 154, 72940, '12.09~01.08', 1545, 1614, 69);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('스타빌'), _resolve_room('스타빌', '301'), 16, 25000, 25000, 27600, '10/08', '11/07', 1445, 1621, 176, 36630, '12.09~01.08', 567, 601, 34);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('스타빌'), _resolve_room('스타빌', '302'), 13, 15000, 25000, 27600, '10/08', '11/07', 1445, 1621, 176, 14850, '12.09~01.08', 424, 437, 13);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('스타빌'), _resolve_room('스타빌', '303'), 22, 25000, 25000, 36120, '10/08', '11/07', 1805, 2021, 216, 26260, '11.09~12.08', 973, 997, 24);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('스타빌'), _resolve_room('스타빌', '305'), 25, 25000, 25000, 36120, '10/08', '11/07', 1805, 2021, 216, 102340, '01.09~02.08', 1577, 1674, 97);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('스타빌'), _resolve_room('스타빌', '401'), 9, 20000, 25000, 37920, '10/08', '11/07', 2748, 2971, 223, 40780, '12.09~01.08', 1028, 1066, 38);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('스타빌'), _resolve_room('스타빌', '402'), 3, 25000, 25000, 37920, '10/08', '11/07', 2748, 2971, 223, 67750, '12.09~01.08', 1164, 1228, 64);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('스타빌'), _resolve_room('스타빌', '403'), 23, 25000, 25000, 42820, '10/08', '11/07', 2311, 2553, 242, 91930, '01.09~02.08', 1162, 1249, 87);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('스타빌'), _resolve_room('스타빌', '405'), 16, 25000, 25000, 42820, '10/08', '11/07', 2311, 2553, 242, 106130, '12.09~01.08', 1570, 1671, 101);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('아페이론'), _resolve_room('아페이론', '101'), 4, 25000, 25000, 14760, '10/11', '11/10', 16149, 16240, 91, 75010, '12.07~01.06', 59, 130, 71);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('아페이론'), _resolve_room('아페이론', '102'), 9, 25000, 25000, 30310, '10/11', '11/10', 18072, 18266, 194, 70860, '12.07~01.06', 80, 147, 67);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('아페이론'), _resolve_room('아페이론', '103'), 17, 25000, 25000, 41270, '10/11', '11/10', 15686, 15922, 236, 91610, '12.07~01.06', 92, 179, 87);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('아페이론'), _resolve_room('아페이론', '104'), 2, 20000, 25000, 36380, '10/11', '11/10', 23464, 23681, 217, 49080, '12.07~01.06', 49, 95, 46);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('아페이론'), _resolve_room('아페이론', '105'), 15, 25000, 25000, 44880, '10/11', '11/10', 17300, 17550, 250, 183930, '12.07~01.06', 154, 330, 176);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('아페이론'), _resolve_room('아페이론', '201'), 10, 25000, 25000, 15060, '10/11', '11/10', 18687, 18780, 93, 82280, '12.07~01.06', 15, 93, 78);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('아페이론'), _resolve_room('아페이론', '202'), 22, 25000, 25000, 24120, '10/11', '11/10', 19137, 19290, 153, 7610, '01.07~02.06', 166, 172, 6);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('아페이론'), _resolve_room('아페이론', '203'), 14, 25000, 25000, 20950, '10/11', '11/10', 18139, 18271, 132, 70860, '12.07~01.06', 70, 137, 67);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('아페이론'), _resolve_room('아페이론', '204'), 19, 25000, 25000, 28810, '10/11', '11/10', 21659, 21843, 184, 124140, '01.07~02.06', 213, 331, 118);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('아페이론'), _resolve_room('아페이론', '205'), 20, 25000, 25000, 14150, '10/11', '11/10', 22477, 22564, 87, 91590, '11.07~12.06', 42, 129, 87);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '201'), 20, 0, 0, 9630, '10/12', '11/11', 8648, 8705, 57, 78390, '2025-12-26 ~ 2026-01-25', 1095, 1169, 74);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '203'), 18, 0, 0, 12190, '10/12', '11/11', 8382, 8456, 74, 39880, '2025-12-26 ~ 2026-01-25', 890, 927, 37);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '205'), 17, 0, 0, 10530, '10/12', '11/11', 10000, 10063, 63, 43000, '2025-12-26 ~ 2026-01-25', 970, 1010, 40);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '206'), 8, 0, 0, 2230, '10/12', '12/11', 8725, 8733, 8, 57550, '2025-11-26 ~ 2025-12-25', 641, 695, 54);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '207'), 0, 0, 0, 0, '', '', 0, 0, 0, 0, '', 0, 0, 0);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '208'), 13, 0, 0, 21250, '10/12', '11/11', 11813, 11947, 134, 96040, '2025-11-26 ~ 2025-12-25', 1149, 1240, 91);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '209'), 15, 0, 0, 2230, '10/12', '11/11', 9286, 9294, 8, 51330, '2025-12-26 ~ 2026-01-25', 443, 491, 48);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '210'), 0, 0, 0, 18990, '10/12', '11/11', 13130, 13249, 119, 0, '', 0, 0, 0);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '301'), 14, 0, 0, 9780, '10/12', '11/11', 10990, 11048, 58, 27380, '2025-11-26 ~ 2025-12-25', 1480, 1505, 25);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '302'), 29, 0, 0, 2830, '10/12', '11/11', 10381, 10393, 12, 27390, '2025-12-26 ~ 2026-01-25', 899, 924, 25);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '303'), 7, 0, 0, 17470, '10/12', '11/11', 9306, 9415, 109, 124130, '2025-11-26 ~ 2025-12-25', 1582, 1700, 118);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '305'), 20, 0, 0, 13250, '10/12', '11/11', 10356, 10437, 81, 89840, '2025-12-26 ~ 2026-01-25', 556, 641, 85);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '306'), 11, 0, 0, 9170, '10/12', '11/11', 8630, 8684, 54, 37740, '2025-10-26 ~ 2025-11-25', 901, 936, 35);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '307'), 0, 0, 0, 0, '', '', 0, 0, 0, 0, '', 0, 0, 0);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '308'), 1, 0, 0, 15060, '10/12', '11/11', 12015, 12108, 93, 11770, '2025-11-26 ~ 2025-12-25', 1070, 1080, 10);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '309'), 24, 0, 0, 13250, '10/12', '11/11', 8547, 8628, 81, 63820, '2025-12-26 ~ 2026-01-25', 741, 801, 60);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '310'), 7, 0, 0, 14310, '10/12', '11/11', 11772, 11860, 88, 8650, '2025-09-26 ~ 2025-10-25', 1730, 1737, 7);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '502'), 15, 0, 0, 9630, '10/12', '11/11', 9612, 9669, 57, 58610, '2025-12-26 ~ 2026-01-25', 901, 956, 55);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '503'), 24, 0, 0, 12340, '10/12', '11/11', 8263, 8338, 75, 36760, '2025-12-26 ~ 2026-01-25', 648, 682, 34);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '505'), 21, 0, 0, 11440, '10/12', '11/11', 10733, 10802, 69, 37800, '2025-12-26 ~ 2026-01-25', 1369, 1404, 35);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '506'), 29, 0, 0, 10980, '10/12', '11/11', 10566, 10632, 66, 50290, '2025-12-26 ~ 2026-01-25', 741, 788, 47);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '507'), 0, 0, 0, 0, '', '', 0, 0, 0, 0, '', 0, 0, 0);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '509'), 23, 0, 0, 13400, '10/12', '11/11', 10360, 10442, 82, 24270, '2025-12-26 ~ 2026-01-25', 603, 625, 22);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '510'), 10, 0, 0, 12490, '10/12', '11/11', 10582, 10658, 76, 96040, '2025-11-26 ~ 2025-12-25', 901, 992, 91);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '601'), 27, 0, 0, 4190, '10/12', '11/11', 11520, 11541, 21, 55490, '2025-12-26 ~ 2026-01-25', 1436, 1488, 52);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '602'), 10, 0, 0, 19290, '12/12', '01/11', 8854, 8975, 121, 6570, '2025-11-26 ~ 2025-12-25', 1078, 1083, 5);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '603'), 1, 0, 0, 16730, '12/12', '01/11', 9401, 9505, 104, 112690, '2025-11-26 ~ 2025-12-25', 348, 455, 107);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '605'), 20, 0, 0, 2680, '10/12', '11/11', 9745, 9756, 11, 80470, '2025-12-26 ~ 2026-01-25', 1192, 1268, 76);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '606'), 22, 0, 0, 8710, '10/12', '11/11', 10499, 10550, 51, 60690, '2025-12-26 ~ 2026-01-25', 610, 667, 57);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('다존하우스'), _resolve_room('다존하우스', '607'), 7, 0, 0, 9920, '10/12', '11/11', 10557, 10616, 59, 22180, '2025-11-26 ~ 2025-12-25', 974, 994, 20);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('W하우스'), _resolve_room('W하우스', '301'), 22, 25000, 25000, 16260, '09/16', '10/15', 1133, 1234, 101, 202660, '12.20~01.19', 1595, 1789, 194);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('W하우스'), _resolve_room('W하우스', '302'), 18, 25000, 25000, 11440, '09/16', '10/15', 531, 600, 69, 100980, '12.20~01.19', 2121, 2217, 96);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('W하우스'), _resolve_room('W하우스', '303'), 20, 25000, 25000, 24570, '09/16', '10/15', 1110, 1266, 156, 26270, '12.20~01.19', 1586, 1610, 24);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('W하우스'), _resolve_room('W하우스', '304'), 10, 25000, 25000, 16730, '09/16', '10/15', 912, 1016, 104, 72880, '10.20~11.19', 2371, 2440, 69);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('W하우스'), _resolve_room('W하우스', '305'), 2, 25000, 25000, 20500, '09/16', '10/15', 1119, 1248, 129, 155976, '12.20~01.19', 2953, 3102, 149);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('W하우스'), _resolve_room('W하우스', '401'), 1, 25000, 25000, 61880, '09/16', '10/15', 9080, 9396, 316, 181910, '12.20~01.19', 258, 432, 174);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('W하우스'), _resolve_room('W하우스', '402'), 26, 25000, 25000, 24730, '09/16', '10/15', 4764, 4921, 157, 122770, '12.20~01.19', 2273, 2390, 117);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('W하우스'), _resolve_room('W하우스', '403'), 11, 30000, 25000, 13400, '09/16', '10/15', 7179, 7261, 82, 97800, '11.20~12.19', 2073, 2166, 93);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('W하우스'), _resolve_room('W하우스', '501'), 28, 25000, 25000, 20650, '09/16', '10/15', 4561, 4691, 130, 98900, '12.20~01.19', 1062, 1156, 94);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('W하우스'), _resolve_room('W하우스', '502'), 7, 30000, 25000, 42300, '09/16', '10/15', 6734, 6974, 240, 158050, '12.20~01.19', 879, 1030, 151);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('W하우스'), _resolve_room('W하우스', '503'), 15, 25000, 25000, 61880, '09/16', '10/15', 10103, 10419, 316, 252470, '12.20~01.19', 3067, 3309, 242);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('W하우스'), _resolve_room('W하우스', '601'), 29, 30000, 25000, 19740, '09/16', '10/15', 6035, 6159, 124, 165200, '11.20~12.19', 1969, 2127, 158);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('W하우스'), _resolve_room('W하우스', '602'), 1, 25000, 25000, 33280, '09/16', '10/15', 1588, 1793, 205, 127870, '11.20~12.19', 3171, 3293, 122);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('W하우스'), _resolve_room('W하우스', '603'), 13, 25000, 25000, 116380, '09/16', '10/15', 3059, 3532, 473, 40800, '12.20~01.19', 1672, 1710, 38);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('W하우스'), _resolve_room('W하우스', '7층'), 14, 25000, 25000, 118970, '09/16', '10/15', 48493, 49199, 706, 66740, '12.20~01.19', 1316, 1379, 63);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('포유빌'), _resolve_room('포유빌', '101'), 11, 15000, 25000, 29560, '09/19', '10/18', 1541, 1730, 189, 133100, '12.09~01.08', 1409, 1536, 127);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('포유빌'), _resolve_room('포유빌', '201'), 29, 25000, 25000, 19130, '09/19', '10/18', 1409, 1529, 120, 98850, '11.09~12.08', 1078, 1172, 94);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('포유빌'), _resolve_room('포유빌', '202'), 13, 25000, 25000, 20800, '09/19', '10/18', 1684, 1815, 131, 142440, '12.09~01.08', 1112, 1248, 136);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('포유빌'), _resolve_room('포유빌', '301'), 26, 25000, 25000, 36120, '09/19', '10/18', 31425, 31641, 216, 97130, '01.09~02.08', 1038, 1130, 92);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('포유빌'), _resolve_room('포유빌', '302'), 20, 20000, 25000, 19890, '09/19', '10/18', 1496, 1621, 125, 170440, '12.09~01.08', 1298, 1461, 163);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('포유빌'), _resolve_room('포유빌', '401'), 4, 15000, 25000, 16570, '09/19', '10/18', 1171, 1274, 103, 115470, '12.09~01.08', 1250, 1360, 110);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('포유빌'), _resolve_room('포유빌', '402'), 19, 15000, 25000, 73990, '09/19', '10/18', 2931, 3294, 363, 176660, '12.09~01.08', 2001, 2170, 169);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('포유빌'), _resolve_room('포유빌', '403'), 20, 15000, 25000, 21100, '09/19', '10/18', 1515, 1648, 133, 179780, '12.09~01.08', 1501, 1673, 172);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('포유빌'), _resolve_room('포유빌', '501'), 7, 25000, 25000, 41270, '09/19', '10/18', 1893, 2129, 236, 138290, '12.09~01.08', 1353, 1485, 132);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('미래홈'), _resolve_room('미래홈', '101'), 10, 0, 0, 14610, '10/12', '11/11', 693, 783, 90, 30510, '2025-12-17 ~ 2026-01-16', 19, 47, 28);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('미래홈'), _resolve_room('미래홈', '102'), 2, 0, 0, 12790, '10/12', '11/11', 552, 630, 78, 28390, '2025-10-17 ~ 2025-11-16', 0, 26, 26);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('미래홈'), _resolve_room('미래홈', '103'), 19, 0, 0, 12490, '10/12', '11/11', 869, 945, 76, 44040, '2025-12-17 ~ 2026-01-16', 31, 72, 41);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('미래홈'), _resolve_room('미래홈', '104'), 30, 0, 0, 17470, '10/12', '11/11', 746, 855, 109, 90870, '2025-12-17 ~ 2026-01-16', 127, 213, 86);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('미래홈'), _resolve_room('미래홈', '105'), 12, 0, 0, 9170, '10/12', '11/11', 271, 325, 54, 107520, '2025-12-17 ~ 2026-01-16', 187, 289, 102);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('미래홈'), _resolve_room('미래홈', '106'), 5, 0, 0, 17930, '10/12', '11/11', 981, 1093, 112, 43000, '2025-12-17 ~ 2026-01-16', 31, 71, 40);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('미래홈'), _resolve_room('미래홈', '107'), 18, 0, 0, 7360, '10/12', '11/11', 545, 587, 42, 4490, '2025-12-17 ~ 2026-01-16', 1, 4, 3);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('미래홈'), _resolve_room('미래홈', '201'), 30, 0, 0, 28200, '10/12', '11/11', 1243, 1423, 180, 69010, '2025-12-17 ~ 2026-01-16', 114, 179, 65);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('미래홈'), _resolve_room('미래홈', '203'), 1, 0, 0, 14150, '10/12', '11/11', 801, 888, 87, 26340, '2025-11-17 ~ 2025-12-16', 20, 44, 24);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('미래홈'), _resolve_room('미래홈', '303'), 4, 0, 0, 16730, '10/12', '11/11', 880, 984, 104, 41940, '2025-11-17 ~ 2025-12-16', 22, 61, 39);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('미래홈'), _resolve_room('미래홈', '304'), 24, 0, 0, 9630, '10/12', '11/11', 505, 562, 57, 30510, '2025-12-17 ~ 2026-01-16', 58, 86, 28);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('미래홈'), _resolve_room('미래홈', '401'), 23, 0, 0, 10980, '10/12', '11/11', 511, 577, 66, 33630, '2025-12-17 ~ 2026-01-16', 43, 74, 31);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('미래홈'), _resolve_room('미래홈', '403'), 1, 0, 0, 8420, '10/12', '11/11', 911, 960, 49, 44020, '2025-11-17 ~ 2025-12-16', 7, 48, 41);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('미래홈'), _resolve_room('미래홈', '404'), 17, 0, 0, 9170, '10/12', '11/11', 471, 525, 54, 24260, '2025-12-17 ~ 2026-01-16', 22, 44, 22);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('미래홈'), _resolve_room('미래홈', '501'), 17, 0, 0, 27750, '10/12', '11/11', 6679, 6856, 177, 41960, '2025-12-17 ~ 2026-01-16', 1188, 1227, 39);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('굿모닝빌'), _resolve_room('굿모닝빌', '201'), 19, 25000, 25000, 24880, '09/18', '10/17', 1334, 1492, 158, 72920, '11.20~12.19', 1812, 1881, 69);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('굿모닝빌'), _resolve_room('굿모닝빌', '203'), 27, 25000, 25000, 30470, '09/18', '10/17', 1158, 1353, 195, 151820, '12.20~01.19', 1914, 2059, 145);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('굿모닝빌'), _resolve_room('굿모닝빌', '204'), 8, 25000, 25000, 28810, '09/18', '10/17', 1260, 1444, 184, 161160, '12.20~01.19', 2303, 2457, 154);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('굿모닝빌'), _resolve_room('굿모닝빌', '301'), 11, 25000, 25000, 18530, '09/18', '10/17', 1278, 1394, 116, 100980, '12.20~01.19', 190, 286, 96);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('굿모닝빌'), _resolve_room('굿모닝빌', '302'), 10, 25000, 25000, 10980, '09/18', '10/17', 1135, 1201, 66, 59410, '10.20~11.19', 399, 455, 56);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('굿모닝빌'), _resolve_room('굿모닝빌', '303'), 26, 25000, 25000, 29260, '09/18', '10/17', 1403, 1590, 187, 27310, '12.20~01.19', 860, 885, 25);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('굿모닝빌'), _resolve_room('굿모닝빌', '304'), 5, 20000, 25000, 24880, '09/18', '10/17', 1631, 1789, 158, 107200, '12.20~01.19', 1703, 1805, 102);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('굿모닝빌'), _resolve_room('굿모닝빌', '401'), 16, 30000, 25000, 58540, '09/18', '10/17', 1926, 2229, 303, 54250, '11.20~12.19', 1921, 1972, 51);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('굿모닝빌'), _resolve_room('굿모닝빌', '402'), 26, 30000, 25000, 72180, '09/18', '10/17', 3205, 3561, 356, 139370, '12.20~01.19', 2531, 2664, 133);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('굿모닝빌'), _resolve_room('굿모닝빌', '501'), 12, 25000, 25000, 44620, '09/18', '10/17', 1202, 1451, 249, 136110, '10.20~11.19', 1350, 1480, 130);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('굿모닝빌'), _resolve_room('굿모닝빌', '502'), 14, 25000, 25000, 29100, '09/18', '10/17', 1763, 1949, 186, 87490, '12.20~01.19', 1727, 1810, 83);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모닝빌'), _resolve_room('모닝빌', '201'), 10, 15000, 25000, 69100, '09/16', '10/15', 10567, 10911, 344, 154930, '12.20~01.19', 1838, 1986, 148);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모닝빌'), _resolve_room('모닝빌', '202'), 10, 20000, 25000, 43080, '09/16', '10/15', 5722, 5965, 243, 138330, '12.20~01.19', 1202, 1334, 132);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모닝빌'), _resolve_room('모닝빌', '203'), 21, 25000, 25000, 27890, '09/16', '10/15', 4950, 5128, 178, 121730, '12.20~01.19', 1051, 1167, 116);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모닝빌'), _resolve_room('모닝빌', '204'), 16, 25000, 25000, 0, '', '', 0, 0, 0, 51160, '04.20~05.19', 1596, 1644, 48);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모닝빌'), _resolve_room('모닝빌', '205'), 10, 25000, 25000, 31220, '09/16', '10/15', 6348, 6548, 200, 300200, '12.20~01.19', 2203, 2491, 288);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모닝빌'), _resolve_room('모닝빌', '301'), 29, 25000, 25000, 78890, '09/16', '10/15', 6983, 7365, 382, 177760, '12.20~01.19', 1366, 1536, 170);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모닝빌'), _resolve_room('모닝빌', '302'), 19, 20000, 25000, 35860, '09/16', '10/15', 5812, 6027, 215, 107200, '12.20~01.19', 1319, 1421, 102);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모닝빌'), _resolve_room('모닝빌', '304'), 6, 25000, 25000, 29260, '09/16', '10/15', 5718, 5905, 187, 125880, '12.20~01.19', 858, 978, 120);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모닝빌'), _resolve_room('모닝빌', '305'), 16, 25000, 25000, 46430, '09/16', '10/15', 4491, 4747, 256, 57400, '12.20~01.19', 1286, 1340, 54);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모닝빌'), _resolve_room('모닝빌', '401'), 17, 25000, 25000, 20340, '09/16', '10/15', 4365, 4493, 128, 33530, '12.20~01.19', 697, 728, 31);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모닝빌'), _resolve_room('모닝빌', '402'), 5, 25000, 25000, 30310, '09/16', '10/15', 7215, 7409, 194, 100980, '12.20~01.19', 554, 650, 96);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모닝빌'), _resolve_room('모닝빌', '403'), 13, 25000, 25000, 20340, '09/16', '10/15', 3666, 3794, 128, 30420, '12.20~01.19', 518, 546, 28);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모닝빌'), _resolve_room('모닝빌', '404'), 6, 25000, 25000, 24880, '09/16', '10/15', 4539, 4697, 158, 111350, '12.20~01.19', 1717, 1823, 106);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모닝빌'), _resolve_room('모닝빌', '405'), 20, 25000, 25000, 50290, '09/16', '10/15', 10718, 10989, 271, 89560, '12.20~01.19', 773, 858, 85);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('에덴빌'), _resolve_room('에덴빌', '102'), 3, 30000, 25000, 10390, '10/25', '11/24', 3145, 3206, 61, 67750, '12.08~01.07', 2357, 2421, 64);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('에덴빌'), _resolve_room('에덴빌', '201'), 20, 25000, 25000, 0, '', '', 0, 0, 0, 136210, '12.08~01.07', 4095, 4225, 130);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('에덴빌'), _resolve_room('에덴빌', '202'), 2, 25000, 25000, 28500, '10/25', '11/24', 3610, 3792, 182, 107170, '12.08~01.07', 1993, 2095, 102);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('에덴빌'), _resolve_room('에덴빌', '203'), 23, 25000, 25000, 11890, '10/25', '11/24', 2519, 2591, 72, 124180, '01.08~02.07', 2477, 2595, 118);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('에덴빌'), _resolve_room('에덴빌', '204'), 13, 25000, 25000, 28500, '10/25', '11/24', 3836, 4018, 182, 131020, '12.08~01.07', 1518, 1643, 125);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('에덴빌'), _resolve_room('에덴빌', '301'), 1, 25000, 25000, 13100, '10/25', '11/24', 3278, 3358, 80, 57380, '12.08~01.07', 1256, 1310, 54);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('에덴빌'), _resolve_room('에덴빌', '302'), 10, 25000, 25000, 12190, '10/25', '11/24', 6391, 6465, 74, 85380, '12.08~01.07', 1948, 2029, 81);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('에덴빌'), _resolve_room('에덴빌', '304'), 13, 25000, 25000, 19290, '10/25', '11/24', 2741, 2862, 121, 57380, '12.08~01.07', 562, 616, 54);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('와이원빈티지'), _resolve_room('와이원빈티지', '201'), 23, 25000, 25000, 15660, '09/18', '10/17', 1236, 1333, 97, 88520, '12.19~01.18', 1224, 1308, 84);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('와이원빈티지'), _resolve_room('와이원빈티지', '202'), 1, 25000, 25000, 17630, '09/18', '10/17', 952, 1062, 110, 72930, '11.19~12.18', 2107, 2176, 69);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('와이원빈티지'), _resolve_room('와이원빈티지', '203'), 24, 15000, 25000, 36890, '09/18', '10/17', 1605, 1824, 219, 44940, '12.19~01.18', 949, 991, 42);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('와이원빈티지'), _resolve_room('와이원빈티지', '204'), 21, 25000, 25000, 21550, '09/18', '10/17', 870, 1006, 136, 35590, '11.19~12.18', 1445, 1478, 33);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('와이원빈티지'), _resolve_room('와이원빈티지', '301'), 1, 25000, 25000, 18390, '09/18', '10/17', 456, 571, 115, 27280, '10.19~11.18', 1553, 1578, 25);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('와이원빈티지'), _resolve_room('와이원빈티지', '302'), 2, 25000, 25000, 17780, '09/18', '10/17', 871, 982, 111, 63620, '12.19~01.18', 556, 616, 60);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('와이원빈티지'), _resolve_room('와이원빈티지', '304'), 12, 20000, 25000, 49260, '09/18', '10/17', 1644, 1911, 267, 111340, '12.19~01.18', 1785, 1891, 106);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('와이원빈티지'), _resolve_room('와이원빈티지', '401'), 13, 25000, 25000, 16260, '09/18', '10/17', 1170, 1271, 101, 53220, '11.19~12.18', 529, 579, 50);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('와이원빈티지'), _resolve_room('와이원빈티지', '402'), 21, 25000, 25000, 8570, '09/18', '10/17', 553, 603, 50, 92670, '12.19~01.18', 1241, 1329, 88);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('와이원빈티지'), _resolve_room('와이원빈티지', '403'), 31, 25000, 25000, 49000, '09/18', '10/17', 1882, 2148, 266, 111340, '12.19~01.18', 1260, 1366, 106);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('와이원빈티지'), _resolve_room('와이원빈티지', '404'), 27, 25000, 25000, 16730, '09/18', '10/17', 827, 931, 104, 189150, '12.19~01.18', 2335, 2516, 181);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('와이원빈티지'), _resolve_room('와이원빈티지', '501'), 30, 25000, 25000, 54410, '09/18', '10/17', 1541, 1828, 287, 7590, '12.19~01.18', 804, 810, 6);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('와이원빈티지'), _resolve_room('와이원빈티지', '502'), 12, 25000, 25000, 10080, '09/18', '10/17', 596, 656, 60, 5520, '12.19~01.18', 985, 989, 4);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('한스텔'), _resolve_room('한스텔', 'B01'), 16, 25000, 25000, 12340, '10/22', '11/21', 13730, 13805, 75, 0, '', 0, 0, 0);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('한스텔'), _resolve_room('한스텔', 'B02'), 17, 25000, 25000, 15520, '10/22', '11/21', 2624, 2720, 96, 32490, '12.13~01.12', 892, 922, 30);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('한스텔'), _resolve_room('한스텔', 'B03'), 9, 15000, 25000, 38180, '10/22', '11/21', 5515, 5739, 224, 128960, '12.13~01.12', 1352, 1475, 123);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('한스텔'), _resolve_room('한스텔', 'B04'), 26, 25000, 25000, 14760, '10/22', '11/21', 3058, 3149, 91, 49090, '12.13~01.12', 1321, 1367, 46);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('한스텔'), _resolve_room('한스텔', '101'), 28, 25000, 25000, 8260, '10/22', '11/21', 5196, 5244, 48, 52410, '01.13~02.12', 2646, 2695, 49);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('한스텔'), _resolve_room('한스텔', '102'), 27, 25000, 25000, 21550, '10/22', '11/21', 5070, 5206, 136, 104490, '01.13~02.12', 2135, 2234, 99);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('한스텔'), _resolve_room('한스텔', '103'), 22, 25000, 25000, 21710, '10/22', '11/21', 9862, 9999, 137, 44940, '12.13~01.12', 1189, 1231, 42);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('한스텔'), _resolve_room('한스텔', '104'), 28, 25000, 25000, 36890, '10/22', '11/21', 5495, 5714, 219, 193020, '01.13~02.12', 3822, 4006, 184);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('한스텔'), _resolve_room('한스텔', '201'), 1, 20000, 25000, 10530, '10/22', '11/21', 7015, 7078, 63, 178750, '12.13~01.12', 3228, 3399, 171);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('한스텔'), _resolve_room('한스텔', '202'), 14, 25000, 25000, 11130, '10/22', '11/21', 9931, 9998, 67, 11740, '12.13~01.12', 1185, 1195, 10);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('한스텔'), _resolve_room('한스텔', '203'), 14, 25000, 25000, 17630, '10/22', '11/21', 2094, 2204, 110, 72940, '12.13~01.12', 1308, 1377, 69);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('한스텔'), _resolve_room('한스텔', '204'), 19, 20000, 25000, 0, '10/22', '11/21', 3283, 3367, 84, 52200, '12.13~01.12', 1470, 1519, 49);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('한스텔'), _resolve_room('한스텔', '301'), 3, 25000, 25000, 73480, '10/22', '11/21', 10543, 10904, 361, 116510, '12.13~01.12', 2047, 2158, 111);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('한스텔'), _resolve_room('한스텔', '302'), 30, 25000, 25000, 42300, '10/22', '11/21', 14457, 14697, 240, 94070, '01.13~02.12', 2340, 2429, 89);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('한스텔'), _resolve_room('한스텔', '303'), 26, 25000, 25000, 10980, '10/22', '11/21', 12589, 12655, 66, 32490, '12.13~01.12', 1652, 1682, 30);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('지앤지2'), _resolve_room('지앤지2', '201'), 5, 20000, 25000, 27890, '10/08', '11/07', 8725, 8903, 178, 242090, '12.20~01.19', 1647, 1879, 232);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('지앤지2'), _resolve_room('지앤지2', '202'), 3, 20000, 0, 34320, '10/08', '11/07', 8108, 8317, 209, 253510, '12.20~01.19', 1394, 1637, 243);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('지앤지2'), _resolve_room('지앤지2', '203'), 7, 20000, 25000, 57250, '10/08', '11/07', 11446, 11744, 298, 219260, '12.20~01.19', 1300, 1510, 210);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('지앤지2'), _resolve_room('지앤지2', '204'), 18, 30000, 25000, 14910, '10/08', '11/07', 7644, 7736, 92, 166240, '11.20~12.19', 1217, 1376, 159);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('지앤지2'), _resolve_room('지앤지2', '301'), 6, 25000, 25000, 24280, '10/08', '11/07', 6947, 7101, 154, 399810, '12.20~01.19', 1578, 1962, 384);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('지앤지2'), _resolve_room('지앤지2', '302'), 29, 25000, 25000, 23210, '10/08', '11/07', 6598, 6745, 147, 124840, '12.20~01.19', 1008, 1127, 119);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('지앤지2'), _resolve_room('지앤지2', '303'), 18, 0, 0, 23970, '10/08', '11/07', 6320, 6472, 152, 138330, '12.20~01.19', 709, 841, 132);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('지앤지2'), _resolve_room('지앤지2', '304'), 19, 25000, 25000, 20950, '10/08', '11/07', 6541, 6673, 132, 196440, '12.20~01.19', 1510, 1698, 188);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('지앤지2'), _resolve_room('지앤지2', '401'), 13, 0, 0, 32770, '12/08', '01/07', 14382, 14585, 203, 497340, '12.20~01.19', 1713, 2191, 478);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('토브미하우스'), _resolve_room('토브미하우스', '201'), 26, 15000, 25000, 23070, '10/24', '11/23', 15839, 15985, 146, 109270, '12.19~01.18', 1885, 1989, 104);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('토브미하우스'), _resolve_room('토브미하우스', '202'), 24, 25000, 25000, 20950, '10/24', '11/23', 17176, 17308, 132, 120080, '12.19~01.18', 880, 994, 114);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('토브미하우스'), _resolve_room('토브미하우스', '203'), 13, 0, 25000, 8260, '10/24', '11/23', 12788, 12836, 48, 5960, '07.19~08.18', 311, 315, 4);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('토브미하우스'), _resolve_room('토브미하우스', '301'), 7, 25000, 25000, 11290, '10/24', '11/23', 16391, 16459, 68, 99930, '12.19~01.18', 2134, 2229, 95);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('토브미하우스'), _resolve_room('토브미하우스', '302'), 2, 30000, 25000, 28960, '10/24', '11/23', 12722, 12907, 185, 72330, '11.19~12.18', 415, 483, 68);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('토브미하우스'), _resolve_room('토브미하우스', '303'), 18, 25000, 25000, 15660, '10/24', '11/23', 12842, 12939, 97, 137720, '12.19~01.18', 429, 560, 131);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('토브미하우스'), _resolve_room('토브미하우스', '401'), 22, 25000, 25000, 29710, '10/24', '11/23', 21508, 21698, 190, 63620, '12.19~01.18', 1035, 1095, 60);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('토브미하우스'), _resolve_room('토브미하우스', '601'), 13, 25000, 25000, 9470, '09/24', '10/23', 19396, 19452, 56, 0, '', 0, 0, 0);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('리트코하우스'), _resolve_room('리트코하우스', '501'), 25, 25000, 25000, 17630, '10/25', '11/24', 9872, 9982, 110, 115930, '12.15~01.14', 235, 345, 110);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('리트코하우스'), _resolve_room('리트코하우스', '502'), 20, 25000, 25000, 18230, '10/25', '11/24', 10129, 10243, 114, 83770, '12.15~01.14', 94, 173, 79);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('리트코하우스'), _resolve_room('리트코하우스', '503'), 31, 25000, 25000, 13400, '10/25', '11/24', 10060, 10142, 82, 63680, '11.15~12.14', 49, 108, 59);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('리트코하우스'), _resolve_room('리트코하우스', '504'), 17, 25000, 25000, 17330, '10/25', '11/24', 11456, 11564, 108, 66140, '12.15~01.14', 105, 167, 62);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('리트코하우스'), _resolve_room('리트코하우스', '505'), 16, 25000, 25000, 19590, '10/25', '11/24', 11755, 11878, 123, 100370, '12.15~01.14', 279, 374, 95);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('리트코하우스'), _resolve_room('리트코하우스', '506'), 10, 25000, 25000, 16120, '10/25', '11/24', 11441, 11541, 100, 30870, '12.15~01.14', 32, 60, 28);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('리트코하우스'), _resolve_room('리트코하우스', '601'), 28, 25000, 25000, 12950, '10/25', '11/24', 11104, 11183, 79, 1820, '01.15~02.14', 74, 74, 0);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('리트코하우스'), _resolve_room('리트코하우스', '602'), 28, 25000, 25000, 19590, '10/25', '11/24', 8084, 8207, 123, 108640, '11.15~12.14', 129, 232, 103);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('리트코하우스'), _resolve_room('리트코하우스', '603'), 1, 25000, 25000, 24420, '10/25', '11/24', 9226, 9381, 155, 50580, '12.15~01.14', 151, 198, 47);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('리트코하우스'), _resolve_room('리트코하우스', '604'), 19, 25000, 25000, 16570, '10/25', '11/24', 11343, 11446, 103, 50580, '12.15~01.14', 77, 124, 47);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('리트코하우스'), _resolve_room('리트코하우스', '605'), 19, 25000, 25000, 18390, '10/25', '11/24', 12023, 12138, 115, 11160, '12.15~01.14', 21, 30, 9);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('리트코하우스'), _resolve_room('리트코하우스', '606'), 19, 25000, 25000, 27890, '10/25', '11/24', 11896, 12074, 178, 68210, '12.15~01.14', 83, 147, 64);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('리트코하우스'), _resolve_room('리트코하우스', '701'), 9, 25000, 25000, 23210, '10/25', '11/24', 12451, 12598, 147, 17380, '12.15~01.14', 5, 20, 15);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('리트코하우스'), _resolve_room('리트코하우스', '702'), 15, 15000, 25000, 10080, '10/25', '11/24', 9111, 9171, 60, 36050, '12.15~01.14', 42, 75, 33);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('리트코하우스'), _resolve_room('리트코하우스', '703'), 6, 25000, 25000, 15520, '10/25', '11/24', 11367, 11463, 96, 99330, '12.15~01.14', 262, 356, 94);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('리트코하우스'), _resolve_room('리트코하우스', '704'), 3, 30000, 25000, 16420, '10/25', '11/24', 16605, 16707, 102, 169870, '12.15~01.14', 167, 329, 162);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('리트코하우스'), _resolve_room('리트코하우스', '705'), 20, 20000, 25000, 21250, '10/25', '11/24', 15587, 15721, 134, 25680, '12.15~01.14', 60, 83, 23);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('리트코하우스'), _resolve_room('리트코하우스', '706'), 9, 25000, 25000, 24420, '10/25', '11/24', 9654, 9809, 155, 98290, '12.15~01.14', 141, 234, 93);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던하우스'), _resolve_room('모던하우스', '201'), 22, 15000, 25000, 51320, '10/12', '11/11', 5499, 5774, 275, 89550, '12.19~01.18', 2413, 2498, 85);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던하우스'), _resolve_room('모던하우스', '202'), 10, 25000, 25000, 31220, '12/12', '01/11', 3346, 3546, 200, 121720, '12.19~01.18', 1909, 2025, 116);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던하우스'), _resolve_room('모던하우스', '203'), 25, 25000, 25000, 15810, '10/12', '11/11', 2422, 2520, 98, 191230, '12.19~01.18', 3927, 4110, 183);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던하우스'), _resolve_room('모던하우스', '204'), 8, 25000, 25000, 35090, '10/12', '11/11', 2375, 2587, 212, 50070, '10.19~11.18', 2088, 2135, 47);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던하우스'), _resolve_room('모던하우스', '205'), 7, 25000, 25000, 12950, '10/12', '11/11', 2449, 2528, 79, 126900, '12.19~01.18', 2202, 2323, 121);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던하우스'), _resolve_room('모던하우스', '301'), 26, 25000, 25000, 15360, '10/12', '11/11', 2213, 2308, 95, 96820, '12.19~01.18', 1820, 1912, 92);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던하우스'), _resolve_room('모던하우스', '302'), 16, 25000, 25000, 24730, '10/12', '11/11', 2743, 2900, 157, 47020, '12.19~01.18', 1310, 1354, 44);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던하우스'), _resolve_room('모던하우스', '303'), 20, 25000, 25000, 33810, '10/12', '11/11', 3357, 3564, 207, 29380, '12.19~01.18', 1148, 1175, 27);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던하우스'), _resolve_room('모던하우스', '304'), 6, 25000, 25000, 14910, '10/12', '11/11', 2598, 2690, 92, 115490, '12.19~01.18', 1502, 1612, 110);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던하우스'), _resolve_room('모던하우스', '305'), 27, 25000, 25000, 27600, '10/12', '11/11', 3667, 3843, 176, 165290, '12.19~01.18', 1825, 1983, 158);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던하우스'), _resolve_room('모던하우스', '402'), 28, 15000, 0, 46680, '10/12', '11/11', 4405, 4662, 257, 112380, '12.19~01.18', 1304, 1411, 107);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던하우스'), _resolve_room('모던하우스', '403'), 18, 15000, 25000, 26080, '10/12', '11/11', 3006, 3172, 166, 128980, '12.19~01.18', 2197, 2320, 123);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던하우스'), _resolve_room('모던하우스', '404'), 31, 25000, 25000, 17630, '10/12', '11/11', 2665, 2775, 110, 77110, '12.19~01.18', 1360, 1433, 73);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던하우스'), _resolve_room('모던하우스', '405'), 27, 25000, 25000, 68320, '10/12', '11/11', 6254, 6595, 341, 69840, '12.19~01.18', 2188, 2254, 66);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던하우스'), _resolve_room('모던하우스', '501'), 14, 25000, 25000, 26390, '10/12', '11/11', 3612, 3780, 168, 92670, '12.19~01.18', 1730, 1818, 88);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던하우스'), _resolve_room('모던하우스', '502'), 7, 25000, 25000, 26680, '10/12', '11/11', 3244, 3414, 170, 137220, '11.19~12.18', 3112, 3243, 131);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던하우스'), _resolve_room('모던하우스', '503'), 15, 25000, 25000, 24120, '10/12', '11/11', 5498, 5651, 153, 6560, '12.19~01.18', 921, 926, 5);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던하우스'), _resolve_room('모던하우스', '504'), 6, 30000, 25000, 12950, '10/12', '11/11', 9982, 10061, 79, 89550, '12.19~01.18', 575, 660, 85);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던라이프'), _resolve_room('모던라이프', '201'), 4, 30000, 25000, 34060, '10/08', '11/07', 2304, 2512, 208, 65630, '10.21~11.20', 2959, 3021, 62);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던라이프'), _resolve_room('모던라이프', '202'), 21, 30000, 25000, 26230, '10/08', '11/07', 1381, 1548, 167, 4480, '09.21~10.20', 2027, 2030, 3);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던라이프'), _resolve_room('모던라이프', '203'), 29, 30000, 25000, 19440, '10/08', '11/07', 2112, 2234, 122, 164290, '12.21~01.20', 2689, 2846, 157);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던라이프'), _resolve_room('모던라이프', '301'), 2, 25000, 25000, 18390, '10/08', '11/07', 1182, 1297, 115, 60470, '11.21~12.20', 1434, 1491, 57);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던라이프'), _resolve_room('모던라이프', '302'), 13, 30000, 25000, 22760, '10/08', '11/07', 2136, 2280, 144, 53260, '12.21~01.20', 2231, 2281, 50);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던라이프'), _resolve_room('모던라이프', '304'), 13, 30000, 25000, 22310, '10/08', '11/07', 1053, 1194, 141, 54290, '12.21~01.20', 2315, 2366, 51);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던라이프'), _resolve_room('모던라이프', '401'), 12, 30000, 25000, 14150, '10/08', '11/07', 948, 1035, 87, 5510, '09.21~10.20', 1236, 1240, 4);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던라이프'), _resolve_room('모던라이프', '402'), 14, 30000, 25000, 23210, '10/08', '11/07', 1007, 1154, 147, 123820, '12.21~01.20', 722, 840, 118);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던라이프'), _resolve_room('모던라이프', '403'), 11, 30000, 25000, 14000, '10/08', '11/07', 1374, 1460, 86, 24170, '10.21~11.20', 835, 857, 22);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던라이프'), _resolve_room('모던라이프', '404'), 13, 25000, 25000, 14760, '10/08', '11/07', 1563, 1654, 91, 63630, '12.21~01.20', 1810, 1870, 60);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던라이프'), _resolve_room('모던라이프', '501'), 11, 35000, 35000, 28960, '10/08', '11/07', 2570, 2755, 185, 217210, '12.21~01.20', 7297, 7505, 208);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던라이프'), _resolve_room('모던라이프', '502'), 20, 30000, 25000, 20200, '10/08', '11/07', 1308, 1435, 127, 54250, '11.21~12.20', 1948, 1999, 51);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던라이프'), _resolve_room('모던라이프', '503'), 5, 30000, 25000, 25330, '10/08', '11/07', 1165, 1326, 161, 125900, '12.21~01.20', 1881, 2001, 120);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('모던라이프'), _resolve_room('모던라이프', '601'), 19, 25000, 25000, 135560, '10/08', '11/07', 3893, 4527, 634, 95690, '10.21~11.20', 7018, 7109, 91);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('서우하우스'), _resolve_room('서우하우스', '301'), 9, 35000, 35000, 7210, '09/19', '10/18', 5311, 5352, 41, 9660, '07.13~08.12', 6, 14, 8);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('서우하우스'), _resolve_room('서우하우스', '302'), 8, 35000, 35000, 41790, '09/19', '10/18', 5808, 6046, 238, 141410, '12.13~01.12', 94, 229, 135);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('서우하우스'), _resolve_room('서우하우스', '401'), 12, 30000, 25000, 47200, '09/19', '10/18', 5313, 5572, 259, 277300, '12.13~01.12', 285, 551, 266);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('서우하우스'), _resolve_room('서우하우스', '402'), 11, 35000, 35000, 42550, '09/19', '10/18', 9005, 9246, 241, 255520, '12.13~01.12', 2560, 2805, 245);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('제이에스하우스'), _resolve_room('제이에스하우스', '501'), 30, 10000, 0, 5390, '11/04', '12/03', 2518, 2547, 29, 50300, '01.10~02.09', 344, 391, 47);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('제이에스하우스'), _resolve_room('제이에스하우스', '502'), 7, 15000, 0, 6760, '11/04', '12/03', 4452, 4490, 38, 10700, '08.10~09.09', 511, 520, 9);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('제이에스하우스'), _resolve_room('제이에스하우스', '503'), 29, 15000, 0, 3730, '11/04', '12/03', 5340, 5358, 18, 31560, '01.10~02.09', 589, 618, 29);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('제이에스하우스'), _resolve_room('제이에스하우스', '505'), 10, 15000, 0, 19590, '11/04', '12/03', 3492, 3615, 123, 56350, '12.10~01.09', 229, 282, 53);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('제이에스하우스'), _resolve_room('제이에스하우스', '601'), 15, 15000, 0, 44100, '11/04', '12/03', 4663, 4910, 247, 127920, '12.10~01.09', 646, 768, 122);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('제이에스하우스'), _resolve_room('제이에스하우스', '602'), 30, 15000, 0, 15210, '11/04', '12/03', 6077, 6171, 94, 61750, '01.10~02.09', 584, 642, 58);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('메종빌'), _resolve_room('메종빌', '101'), 17, 30000, 25000, 35610, '09/24', '10/23', 2260, 2474, 214, 48040, '11.19~12.18', 780, 825, 45);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('메종빌'), _resolve_room('메종빌', '201'), 6, 30000, 25000, 22310, '10/24', '11/23', 5016, 5157, 141, 91630, '12.19~01.18', 1694, 1781, 87);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('메종빌'), _resolve_room('메종빌', '202'), 9, 30000, 25000, 24570, '10/24', '11/23', 6609, 6765, 156, 180850, '12.19~01.18', 1859, 2032, 173);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('메종빌'), _resolve_room('메종빌', '203'), 18, 30000, 25000, 15810, '10/24', '11/23', 4722, 4820, 98, 93710, '12.19~01.18', 1514, 1603, 89);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('메종빌'), _resolve_room('메종빌', '301'), 27, 30000, 25000, 25780, '09/24', '10/23', 6509, 6673, 164, 190190, '12.19~01.18', 1279, 1461, 182);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('메종빌'), _resolve_room('메종빌', '302'), 6, 30000, 25000, 24120, '10/24', '11/23', 4962, 5115, 153, 16930, '11.19~12.18', 981, 996, 15);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('메종빌'), _resolve_room('메종빌', '303'), 12, 30000, 25000, 44620, '10/24', '11/23', 14688, 219, 249, 65670, '11.19~12.18', 1384, 1446, 62);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('메종빌'), _resolve_room('메종빌', '401'), 5, 30000, 25000, 22460, '10/24', '11/23', 14073, 125, 142, 99820, '10.19~11.18', 2229, 2324, 95);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('메종빌'), _resolve_room('메종빌', '402'), 28, 30000, 25000, 16260, '10/24', '11/23', 17410, 87, 101, 58430, '12.19~01.18', 1330, 1385, 55);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('메종빌'), _resolve_room('메종빌', '403'), 10, 30000, 25000, 26230, '10/24', '11/23', 5820, 5987, 167, 121720, '12.19~01.18', 1528, 1644, 116);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('메종빌'), _resolve_room('메종빌', '501'), 17, 30000, 25000, 28960, '09/24', '10/23', 2670, 2855, 185, 124830, '12.19~01.18', 625, 744, 119);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('메종빌'), _resolve_room('메종빌', '502'), 7, 30000, 25000, 18990, '09/24', '10/23', 2350, 2469, 119, 69840, '12.19~01.18', 445, 511, 66);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('메종빌'), _resolve_room('메종빌', '503'), 16, 30000, 25000, 25490, '09/24', '10/23', 2335, 2497, 162, 155950, '12.19~01.18', 613, 762, 149);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('메종빌'), _resolve_room('메종빌', '601'), 25, 25000, 25000, 92840, '09/24', '10/23', 4175, 4583, 408, 105120, '12.19~01.18', 751, 851, 100);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('메종빌'), _resolve_room('메종빌', '602'), 14, 30000, 25000, 15660, '09/24', '10/23', 2259, 2356, 97, 26270, '12.19~01.18', 434, 458, 24);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('메종빌'), _resolve_room('메종빌', '603'), 2, 30000, 25000, 41530, '09/24', '10/23', 2746, 2983, 237, 31460, '12.19~01.18', 281, 310, 29);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('옥당빌라'), _resolve_room('옥당빌라', '202'), 1, 25000, 25000, 8710, '12/08', '01/07', 2490, 2541, 51, 56370, '12.21~01.20', 1624, 1677, 53);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('옥당빌라'), _resolve_room('옥당빌라', '203'), 28, 25000, 25000, 44280, '11/03', '12/07', 2311, 2570, 259, 136270, '12.21~01.20', 1497, 1627, 130);
INSERT INTO billing_configs (building_id, room_id, deposit_months, water_fee, cable_fee, elec_amount, elec_start, elec_end, elec_price, elec_surcharge, elec_tax, gas_amount, gas_period, gas_price, gas_cold_price, gas_tax)
VALUES (_resolve_building('옥당빌라'), _resolve_room('옥당빌라', '302'), 24, 35000, 35000, 7510, '12/08', '01/07', 8102, 8145, 43, 37690, '12.21~01.20', 1661, 1696, 35);

-- Cleanup
DROP FUNCTION IF EXISTS _resolve_building(TEXT);
DROP FUNCTION IF EXISTS _resolve_room(TEXT, TEXT);
