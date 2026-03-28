-- buildings 테이블 (현행 스키마 반영 — 2026-03-24 기준)
-- 주의: 이 파일은 레퍼런스용. 운영 DB에 직접 실행하지 말 것.
-- 변경 시 alter_add_columns.sql에 ALTER 문도 함께 추가할 것.

drop policy if exists "tenants_all" on tenants;
drop policy if exists "rooms_all" on rooms;
drop policy if exists "buildings_all" on buildings;
drop table if exists tenants;
drop table if exists rooms;
drop table if exists buildings;

create table buildings (
  -- [기본정보]
  id bigint generated always as identity primary key,
  building_name text not null,
  building_nickname text,
  address_old text,
  address_road text,
  approved_date date,
  building_area_total numeric,
  is_active bool default true,

  -- [건물유형]
  is_short_term_rental bool default false,
  is_long_term_rental bool default false,
  is_commercial bool default false,
  is_management_agency bool default false,
  is_corporate_facility bool default false,

  -- [건물주 1]
  owner_name text,
  owner_resident_number text,
  owner_phone text,
  owner_email text,
  owner_email_2 text,
  owner_home_address text,
  owner_home_address_detail text,
  owner_business_registration_number text,
  owner_business_name text,
  owner_business_address text,
  owner_business_type text,
  owner_business_item text,
  owner_entity_type text,

  -- [건물주 2]
  owner_2_name text,
  owner_2_resident_number text,
  owner_2_phone text,
  owner_2_email text,
  owner_2_home_address text,
  owner_2_home_address_detail text,

  -- [건물주 3]
  owner_3_name text,
  owner_3_resident_number text,
  owner_3_phone text,
  owner_3_email text,
  owner_3_home_address text,
  owner_3_home_address_detail text,

  -- [건물주 공통]
  co_owner_memo text,
  primary_report_owner text,

  -- [담당자/연락처]
  contact_person_name text,
  contact_person_phone text,
  contact_person_email text,
  is_contact_person_primary bool default false,

  -- [소장/현장관리인]
  site_manager_name text,
  site_manager_phone text,
  site_manager_email text,

  -- [담당직원]
  assigned_person text,

  -- [세무사]
  tax_accountant_company text,
  tax_accountant_name text,
  tax_accountant_phone text,
  tax_accountant_email text,

  -- [호실]
  total_rooms int default 0,
  has_rooms bool default true,

  -- [건물 시설/접근]
  entrance_door_password text,
  electric_meter_location text,
  electric_meter_box_password text,
  gas_meter_location text,
  parking_gate_info text,
  parking_gate_password text,
  parking_total_spaces int default 0,
  is_cctv bool default false,
  cctv_count int default 0,
  cctv_room_location text,
  cctv_password text,
  cctv_install_info text,
  rooftop_access_method text,
  is_storage_available bool default false,

  -- [공과금/유틸리티]
  electric_common_customer_number text,
  water_common_customer_number text,
  electric_contract_power text,
  electric_voltage_type text,
  electric_customer_number text,
  water_customer_number text,
  internet_provider text,
  internet_contract_expiry_date date,

  -- [법적/행정]
  is_resident_registration_allowed bool,
  is_rental_business_registered bool default false,
  rental_business_memo text,
  is_renthome_writing_agency bool default false,
  is_standard_contract bool default false,
  is_fire_inspection_self bool default false,

  -- [수수료/정산]
  fee_type text,
  fee_rate numeric default 0,
  fee_fixed_amount int default 0,
  fee_vat_type text,
  is_penalty_7days bool default false,
  penalty_7days_ownership text,
  is_broker_deduct bool default false,
  default_cleaning_fee int default 0,
  ignore_owner_expense bool default false,
  free_repair_limit int default 0,
  management_fee_type text,
  management_fee_rate numeric default 0,
  management_fee_fixed_amount int default 0,

  -- [계좌 — 청구용 (최대3)]
  houseman_billing_account text,
  billing_account_1 text,
  billing_account_1_bank text,
  billing_account_1_holder text,
  billing_account_2 text,
  billing_account_2_bank text,
  billing_account_2_holder text,
  billing_account_3 text,
  billing_account_3_bank text,
  billing_account_3_holder text,

  -- [계좌 — 정산용 (최대2)]
  settlement_account_1 text,
  settlement_account_1_bank text,
  settlement_account_1_holder text,
  settlement_account_2 text,
  settlement_account_2_bank text,
  settlement_account_2_holder text,

  -- [계좌 타겟 (항목별 입금처)]
  rent_account_target text,
  mgmt_account_target text,
  utility_account_target text,
  elec_gas_account_target text,
  deposit_account_target text,
  deposit_management_amount int default 0,

  -- [계좌 기타]
  has_variable_management_fee bool default false,

  -- [정산일]
  settlement_count int default 1,
  settlement_day_1 int,
  settlement_day_2 int,
  settlement_split_type text,
  settlement_split_value int,

  -- [청구 설정]
  rent_billing_type text,
  management_fee_billing_type text,
  water_billing_type text,
  internet_billing_type text,
  billing_cycle text,
  billing_cycle_days int,
  fixed_contract_amount int,
  has_additional_charge bool default false,

  -- [계약서 특약사항]
  contract_special_terms_short_term text,
  contract_special_terms_long_term text,
  contract_special_terms_commercial text,

  -- [운영]
  contract_start_date date,
  septic_tank_cleaning_month_1 int,
  septic_tank_cleaning_month_2 int,
  monthly_inspection_count int,

  -- [첨부파일]
  fire_insurance_document_url text,
  document_building_register_url text,
  document_management_contract_url text,
  document_business_registration_url text,
  document_completion_drawing_url text,

  -- [메모]
  memo text,
  created_at timestamptz default now()
);

alter table buildings enable row level security;
create policy "buildings_all" on buildings for all using (true) with check (true);
