-- rooms 테이블: 관리정보 시트의 빠진 컬럼 추가
alter table rooms add column if not exists deposit_account_name text;       -- 입금이름 (예: "다존", "JJ")
alter table rooms add column if not exists deposit_account_1 text;          -- 입금계좌1
alter table rooms add column if not exists deposit_account_2 text;          -- 입금계좌2
alter table rooms add column if not exists collection_team text;            -- 수금팀 (1팀/2팀)
alter table rooms add column if not exists building_cleaning_type text;     -- 건물청소 (크린/외부)
alter table rooms add column if not exists moveout_cleaning_type text;      -- 퇴실청소 (크린/외부)

-- buildings 테이블: 건물정보 시트의 빠진 컬럼 추가
alter table buildings add column if not exists assigned_person text;         -- 담당직원
alter table buildings add column if not exists is_rental_business_registered bool default false;  -- 임대사업자 여부
