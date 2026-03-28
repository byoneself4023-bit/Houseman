-- 테스트 데이터: 건물 1개 + 호실 3개 + 임차인 3명

-- 1. 건물
insert into buildings (building_name, building_nickname, address_road, is_short_term_rental, owner_name, fee_type, fee_rate, total_rooms)
values ('제이앤제이', '제이', '서울시 관악구 봉천로 123', true, '김건물주', 'pct', 0.05, 5);

-- 2. 호실 (building_id는 위에서 자동 생성된 id 사용)
insert into rooms (building_id, room_number, is_managed, standard_deposit, standard_rent, standard_management_fee, standard_water_fee, standard_internet_fee, standard_cleaning_fee)
values
  ((select id from buildings where building_name='제이앤제이'), '201', true, 10000000, 1400000, 120000, 25000, 25000, 100000),
  ((select id from buildings where building_name='제이앤제이'), '301', true, 10000000, 1650000, 120000, 25000, 25000, 100000),
  ((select id from buildings where building_name='제이앤제이'), '401', true, 15000000, 2100000, 120000, 25000, 25000, 150000);

-- 3. 임차인
insert into tenants (
  room_id, building_id, name, phone, is_active,
  deposit, rent, management_fee, water_fee, internet_fee, cleaning_fee,
  payment_due_day, contract_start_date, contract_end_date, move_in_date
)
values
  (
    (select id from rooms where room_number='201' and building_id=(select id from buildings where building_name='제이앤제이')),
    (select id from buildings where building_name='제이앤제이'),
    '박정미', '010-1234-5678', true,
    10000000, 1400000, 120000, 25000, 25000, 100000,
    21, '2025-03-21', '2027-03-20', '2025-03-21'
  ),
  (
    (select id from rooms where room_number='301' and building_id=(select id from buildings where building_name='제이앤제이')),
    (select id from buildings where building_name='제이앤제이'),
    '차민철', '010-2345-6789', true,
    10000000, 1650000, 120000, 25000, 25000, 100000,
    21, '2025-01-21', '2027-01-20', '2025-01-21'
  ),
  (
    (select id from rooms where room_number='401' and building_id=(select id from buildings where building_name='제이앤제이')),
    (select id from buildings where building_name='제이앤제이'),
    '박유하', '010-3456-7890', true,
    15000000, 2100000, 120000, 25000, 25000, 150000,
    21, '2025-06-01', '2027-05-31', '2025-06-01'
  );
