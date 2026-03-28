const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');

const supabase = createClient(
  'https://dmnppqcpymougyvkmajm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtbnBwcWNweW1vdWd5dmttYWptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk5ODUyNiwiZXhwIjoyMDg5NTc0NTI2fQ.33bhdrpyjO0LyPS5TPBLsUjDk2bWgmsPyOPjfcNcC_8'
);

const PAT = 'sbp_7d2e36f39d0ed4a50543c9f8bc156f955b182084';
const PROJECT_REF = 'dmnppqcpymougyvkmajm';

async function runSQL(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (res.status !== 201) throw new Error(`SQL failed (${res.status}): ${await res.text()}`);
  return res.json();
}

function readSheet(filePath, sheetIndex = 0) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[sheetIndex]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
  // Row 0 = headers, Row 1 = desc, Row 2 = rules, Row 3+ = data (row 3 may be example OR real data)
  const headers = data[0];
  const rows = data.slice(3); // skip headers, desc, rules only
  return { headers, rows };
}

function clean(val) {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'string' && val.trim() === '') return null;
  return val;
}

function toBool(val) {
  if (val === true || val === 'TRUE' || val === 'true') return true;
  if (val === false || val === 'FALSE' || val === 'false') return false;
  return null;
}

function toNum(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  if (isNaN(n)) return null;
  // 정수 필드에서 소수점 오류 방지
  if (Number.isInteger(n)) return n;
  return Math.round(n);
}

function toDate(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (s.match(/^\d{4}-\d{2}-\d{2}$/)) return s;
  return null;
}

async function main() {
  const dir = path.join(__dirname, '..');

  // ===== STEP 1: 기존 데이터 삭제 =====
  console.log('1. 기존 데이터 삭제...');
  await runSQL('DELETE FROM tenants;');
  console.log('   tenants 삭제 완료');
  await runSQL('DELETE FROM rooms;');
  console.log('   rooms 삭제 완료');
  await runSQL('DELETE FROM buildings;');
  console.log('   buildings 삭제 완료');
  // ID 시퀀스 리셋
  await runSQL("ALTER SEQUENCE buildings_id_seq RESTART WITH 1;");
  await runSQL("ALTER SEQUENCE rooms_id_seq RESTART WITH 1;");
  await runSQL("ALTER SEQUENCE tenants_id_seq RESTART WITH 1;");
  console.log('   시퀀스 리셋 완료');

  // ===== STEP 2: Buildings 업로드 =====
  console.log('\n2. Buildings 업로드...');
  const bldg = readSheet(path.join(dir, '① buildings_건물정보_작성중.xlsx'));

  const buildingRows = [];
  for (const row of bldg.rows) {
    const name = clean(row[bldg.headers.indexOf('building_name')]);
    if (!name) continue;

    const obj = {};
    bldg.headers.forEach((h, i) => {
      if (h === 'building_name') obj.building_name = name;
      else if (h === 'building_nickname') obj.building_nickname = clean(row[i]);
      else if (h === 'address_old') obj.address_old = clean(row[i]);
      else if (h === 'address_road') obj.address_road = clean(row[i]);
      else if (h === 'approved_date') obj.approved_date = toDate(row[i]);
      else if (h === 'building_area_total') obj.building_area_total = toNum(row[i]);
      else if (h === 'is_short_term_rental') obj.is_short_term_rental = toBool(row[i]);
      else if (h === 'is_long_term_rental') obj.is_long_term_rental = toBool(row[i]);
      else if (h === 'is_commercial') obj.is_commercial = toBool(row[i]);
      else if (h === 'is_management_agency') obj.is_management_agency = toBool(row[i]);
      else if (h === 'is_corporate_facility') obj.is_corporate_facility = toBool(row[i]);
      else if (h === 'owner_name') obj.owner_name = clean(row[i]);
      else if (h === 'owner_resident_number') obj.owner_resident_number = clean(row[i]);
      else if (h === 'owner_phone') obj.owner_phone = clean(row[i]);
      else if (h === 'owner_email') obj.owner_email = clean(row[i]);
      else if (h === 'owner_home_address') obj.owner_home_address = clean(row[i]);
      else if (h === 'owner_business_registration_number') obj.owner_business_registration_number = clean(row[i]);
      else if (h === 'owner_business_name') obj.owner_business_name = clean(row[i]);
      else if (h === 'owner_business_address') obj.owner_business_address = clean(row[i]);
      else if (h === 'owner_business_type') obj.owner_business_type = clean(row[i]);
      else if (h === 'owner_business_item') obj.owner_business_item = clean(row[i]);
      else if (h === 'owner_entity_type') obj.owner_entity_type = clean(row[i]);
      else if (h === 'owner_2_name') obj.owner_2_name = clean(row[i]);
      else if (h === 'owner_2_resident_number') obj.owner_2_resident_number = clean(row[i]);
      else if (h === 'owner_2_phone') obj.owner_2_phone = clean(row[i]);
      else if (h === 'owner_2_email') obj.owner_2_email = clean(row[i]);
      else if (h === 'owner_2_home_address') obj.owner_2_home_address = clean(row[i]);
      else if (h === 'owner_3_name') obj.owner_3_name = clean(row[i]);
      else if (h === 'owner_3_resident_number') obj.owner_3_resident_number = clean(row[i]);
      else if (h === 'owner_3_phone') obj.owner_3_phone = clean(row[i]);
      else if (h === 'owner_3_email') obj.owner_3_email = clean(row[i]);
      else if (h === 'owner_3_home_address') obj.owner_3_home_address = clean(row[i]);
      else if (h === 'co_owner_memo') obj.co_owner_memo = clean(row[i]);
      else if (h === 'owner_bank_account_1') obj.owner_bank_account_1 = clean(row[i]);
      else if (h === 'owner_bank_account_1_type') obj.owner_bank_account_1_type = clean(row[i]);
      else if (h === 'owner_bank_account_2') obj.owner_bank_account_2 = clean(row[i]);
      else if (h === 'owner_bank_account_2_type') obj.owner_bank_account_2_type = clean(row[i]);
      else if (h === 'contact_person_name') obj.contact_person_name = clean(row[i]);
      else if (h === 'contact_person_phone') obj.contact_person_phone = clean(row[i]);
      else if (h === 'building_manager_name') obj.building_manager_name = clean(row[i]);
      else if (h === 'building_manager_phone') obj.building_manager_phone = clean(row[i]);
      else if (h === 'tax_accountant_company') obj.tax_accountant_company = clean(row[i]);
      else if (h === 'tax_accountant_name') obj.tax_accountant_name = clean(row[i]);
      else if (h === 'tax_accountant_phone') obj.tax_accountant_phone = clean(row[i]);
      else if (h === 'tax_accountant_email') obj.tax_accountant_email = clean(row[i]);
      else if (h === 'total_rooms') obj.total_rooms = toNum(row[i]);
      else if (h === 'has_rooms') obj.has_rooms = toBool(row[i]);
      else if (h === 'entrance_door_password') obj.entrance_door_password = clean(row[i]);
      else if (h === 'electric_meter_location') obj.electric_meter_location = clean(row[i]);
      else if (h === 'electric_meter_password') obj.electric_meter_password = clean(row[i]);
      else if (h === 'gas_meter_location') obj.gas_meter_location = clean(row[i]);
      else if (h === 'gas_meter_password') obj.gas_meter_password = clean(row[i]);
      else if (h === 'parking_gate_info') obj.parking_gate_info = clean(row[i]);
      else if (h === 'is_cctv') obj.is_cctv = toBool(row[i]);
      else if (h === 'cctv_room_location') obj.cctv_room_location = clean(row[i]);
      else if (h === 'cctv_password') obj.cctv_password = clean(row[i]);
      else if (h === 'rooftop_access_method') obj.rooftop_access_method = clean(row[i]);
      else if (h === 'is_storage_available') obj.is_storage_available = toBool(row[i]);
      else if (h === 'internet_provider') obj.internet_provider = clean(row[i]);
      else if (h === 'internet_contract_expiry_date') obj.internet_contract_expiry_date = toDate(row[i]);
      else if (h === 'is_resident_registration_allowed') obj.is_resident_registration_allowed = toBool(row[i]);
      else if (h === 'is_renthome_agency') obj.is_renthome_agency = toBool(row[i]);
      else if (h === 'is_standard_contract') obj.is_standard_contract = toBool(row[i]);
      else if (h === 'fee_type') obj.fee_type = clean(row[i]);
      else if (h === 'fee_rate') obj.fee_rate = toNum(row[i]);
      else if (h === 'fee_fixed_amount') obj.fee_fixed_amount = toNum(row[i]);
      else if (h === 'fee_vat_type') obj.fee_vat_type = clean(row[i]);
      else if (h === 'is_penalty_7days') obj.is_penalty_7days = toBool(row[i]);
      else if (h === 'management_fee_billing_type') obj.management_fee_billing_type = clean(row[i]);
      else if (h === 'water_billing_type') obj.water_billing_type = clean(row[i]);
      else if (h === 'internet_billing_type') obj.internet_billing_type = clean(row[i]);
      else if (h === 'tenant_account_type') obj.tenant_account_type = clean(row[i]);
      else if (h === 'has_variable_management_fee') obj.has_variable_management_fee = toBool(row[i]);
      else if (h === 'settlement_count') obj.settlement_count = toNum(row[i]);
      else if (h === 'settlement_day_1') obj.settlement_day_1 = toNum(row[i]);
      else if (h === 'settlement_day_2') obj.settlement_day_2 = toNum(row[i]);
      else if (h === 'contract_start_date') obj.contract_start_date = toDate(row[i]);
      else if (h === 'monthly_inspection_count') obj.monthly_inspection_count = toNum(row[i]);
      else if (h === 'special_terms') obj.special_terms = clean(row[i]);
      else if (h === 'memo') obj.memo = clean(row[i]);
    });

    // Remove null values to let DB defaults work
    Object.keys(obj).forEach(k => { if (obj[k] === null) delete obj[k]; });
    buildingRows.push(obj);
  }

  // Insert buildings in batches
  console.log(`   ${buildingRows.length}개 건물 삽입 중...`);
  const { data: insertedBuildings, error: bErr } = await supabase
    .from('buildings')
    .insert(buildingRows)
    .select('id, building_name');

  if (bErr) { console.error('Buildings 삽입 에러:', bErr); return; }
  console.log(`   ✅ ${insertedBuildings.length}개 건물 삽입 완료`);

  // Building name → ID 매핑 (대소문자 & 동 변환 포함)
  const bldgIdMap = {};
  insertedBuildings.forEach(b => { bldgIdMap[b.building_name] = b.id; });
  // 별칭 매핑
  if (bldgIdMap['w하우스']) bldgIdMap['W하우스'] = bldgIdMap['w하우스'];
  if (bldgIdMap['W하우스']) bldgIdMap['w하우스'] = bldgIdMap['W하우스'];
  if (bldgIdMap['더힐하우스']) {
    bldgIdMap['더힐하우스101동'] = bldgIdMap['더힐하우스'];
    bldgIdMap['더힐하우스102동'] = bldgIdMap['더힐하우스'];
    bldgIdMap['더힐하우스103동'] = bldgIdMap['더힐하우스'];
    bldgIdMap['더힐하우스104동'] = bldgIdMap['더힐하우스'];
  }

  // ===== STEP 3: Rooms 업로드 =====
  console.log('\n3. Rooms 업로드...');
  const rm = readSheet(path.join(dir, '② rooms_호실정보_작성중.xlsx'));

  const roomRows = [];
  for (const row of rm.rows) {
    const bName = clean(row[rm.headers.indexOf('building_name')]);
    const roomNum = clean(row[rm.headers.indexOf('room_number')]);
    if (!bName || !roomNum) continue;

    const buildingId = bldgIdMap[bName];
    if (!buildingId) { console.warn(`   ⚠️ 건물 매핑 실패: ${bName} ${roomNum}`); continue; }

    const obj = { building_id: buildingId, room_number: String(roomNum) };

    rm.headers.forEach((h, i) => {
      const v = row[i];
      if (h === 'building_name' || h === 'room_number') return; // already handled
      if (h === 'is_managed') obj.is_managed = toBool(v);
      else if (h === 'room_type') obj.room_type = toNum(v);
      else if (h === 'area') { const n = toNum(v); if (n) obj.area = n; }
      else if (h === 'room_layout') { const c = clean(v); if (c) obj.room_layout = c; }
      else if (h === 'electric_customer_number') { const c = clean(v); if (c) obj.electric_customer_number = String(c); }
      else if (h === 'gas_customer_number') { const c = clean(v); if (c) obj.gas_customer_number = String(c); }
      else if (h === 'standard_deposit' || h === 'deposit') { const n = toNum(v); if (n !== null) obj.standard_deposit = n; }
      else if (h === 'standard_rent' || h === 'rent') { const n = toNum(v); if (n !== null) obj.standard_rent = n; }
      else if (h === 'standard_management_fee' || h === 'management_fee') { const n = toNum(v); if (n !== null) obj.standard_management_fee = n; }
      else if (h === 'standard_water_fee' || h === 'water_fee') { const n = toNum(v); if (n !== null) obj.standard_water_fee = n; }
      else if (h === 'standard_internet_fee' || h === 'internet_fee') { const n = toNum(v); if (n !== null) obj.standard_internet_fee = n; }
      else if (h === 'standard_cleaning_fee' || h === 'cleaning_fee') { const n = toNum(v); if (n !== null) obj.standard_cleaning_fee = n; }
      else if (h === 'standard_parking_fee' || h === 'parking_fee') { const n = toNum(v); if (n !== null) obj.standard_parking_fee = n; }
      else if (h === 'tenant_account_type') { const c = clean(v); if (c) obj.tenant_account_type = c; }
      else if (h === 'management_fee_billing_type') { const c = clean(v); if (c) obj.management_fee_billing_type = c; }
      else if (h === 'water_billing_type') { const c = clean(v); if (c) obj.water_billing_type = c; }
      else if (h === 'internet_billing_type') { const c = clean(v); if (c) obj.internet_billing_type = c; }
      else if (h === 'memo') { const c = clean(v); if (c) obj.memo = c; }
    });

    roomRows.push(obj);
  }

  // Insert rooms in batches of 100
  console.log(`   ${roomRows.length}개 호실 삽입 중...`);
  let allInsertedRooms = [];
  for (let i = 0; i < roomRows.length; i += 100) {
    const batch = roomRows.slice(i, i + 100);
    const { data: inserted, error: rErr } = await supabase
      .from('rooms')
      .insert(batch)
      .select('id, building_id, room_number');
    if (rErr) { console.error(`Rooms batch ${i} 에러:`, rErr); return; }
    allInsertedRooms = allInsertedRooms.concat(inserted);
    process.stdout.write(`   ${allInsertedRooms.length}/${roomRows.length}...\r`);
  }
  console.log(`   ✅ ${allInsertedRooms.length}개 호실 삽입 완료`);

  // Room (building_id + room_number) → room_id 매핑
  const roomIdMap = {};
  allInsertedRooms.forEach(r => {
    roomIdMap[`${r.building_id}_${r.room_number}`] = r.id;
  });

  // ===== STEP 4: Tenants 업로드 =====
  console.log('\n4. Tenants 업로드...');
  const tn = readSheet(path.join(dir, '③ tenants_임차인정보_작성중.xlsx'));

  const tenantRows = [];
  let skipped = 0;
  for (const row of tn.rows) {
    const bName = clean(row[tn.headers.indexOf('building_name')]);
    const roomNum = clean(row[tn.headers.indexOf('room_number')]);
    const name = clean(row[tn.headers.indexOf('name')]);
    if (!bName || !roomNum || !name) continue;

    const buildingId = bldgIdMap[bName];
    if (!buildingId) { skipped++; continue; }

    const roomKey = `${buildingId}_${String(roomNum)}`;
    const roomId = roomIdMap[roomKey];
    if (!roomId) { skipped++; continue; }

    const obj = {
      building_id: buildingId,
      room_id: roomId,
      name: String(name)
    };

    tn.headers.forEach((h, i) => {
      const v = row[i];
      if (['building_name','room_number','name'].includes(h)) return;
      if (h === 'phone') { const c = clean(v); if (c) obj.phone = String(c); }
      else if (h === 'email') { const c = clean(v); if (c) obj.email = c; }
      else if (h === 'business_registration_number') { const c = clean(v); if (c) obj.business_registration_number = String(c); }
      else if (h === 'id_number') { const c = clean(v); if (c) obj.id_number = String(c); }
      else if (h === 'emergency_contact_name') { const c = clean(v); if (c) obj.emergency_contact_name = c; }
      else if (h === 'emergency_contact_phone') { const c = clean(v); if (c) obj.emergency_contact_phone = String(c); }
      else if (h === 'emergency_contact_relation') { const c = clean(v); if (c) obj.emergency_contact_relation = c; }
      else if (h === 'contract_start_date') obj.contract_start_date = toDate(v);
      else if (h === 'contract_end_date') obj.contract_end_date = toDate(v);
      else if (h === 'move_in_date') obj.move_in_date = toDate(v);
      else if (h === 'move_out_date') obj.move_out_date = toDate(v);
      else if (h === 'is_active') obj.is_active = toBool(v);
      else if (h === 'deposit' || h === 'actual_deposit') { const n = toNum(v); if (n !== null) obj.deposit = n; }
      else if (h === 'other_deposit1_desc') { const c = clean(v); if (c) obj.other_deposit1_desc = c; }
      else if (h === 'other_deposit1_amount') { const n = toNum(v); if (n !== null) obj.other_deposit1_amount = n; }
      else if (h === 'rent' || h === 'actual_rent') { const n = toNum(v); if (n !== null) obj.rent = n; }
      else if (h === 'management_fee' || h === 'actual_management_fee') { const n = toNum(v); if (n !== null) obj.management_fee = n; }
      else if (h === 'water_fee' || h === 'actual_water_fee') { const n = toNum(v); if (n !== null) obj.water_fee = n; }
      else if (h === 'internet_fee' || h === 'actual_internet_fee') { const n = toNum(v); if (n !== null) obj.internet_fee = n; }
      else if (h === 'cleaning_fee' || h === 'actual_cleaning_fee') { const n = toNum(v); if (n !== null) obj.cleaning_fee = n; }
      else if (h === 'parking_fee_1') { const n = toNum(v); if (n !== null) obj.parking_fee_1 = n; }
      else if (h === 'rent_billing_type') { const c = clean(v); if (c) obj.rent_billing_type = c; }
      else if (h === 'car_number_1') { const c = clean(v); if (c) obj.car_number_1 = String(c); }
      else if (h === 'car_type_1') { const c = clean(v); if (c) obj.car_type_1 = c; }
      else if (h === 'broker_name') { const c = clean(v); if (c) obj.broker_name = c; }
      else if (h === 'broker_phone') { const c = clean(v); if (c) obj.broker_phone = String(c); }
      else if (h === 'broker_fee_amount') { const n = toNum(v); if (n !== null) obj.broker_fee_amount = n; }
      else if (h === 'broker_fee_paid') obj.broker_fee_paid = toBool(v);
      else if (h === 'pet_discovered_date') obj.pet_discovered_date = toDate(v);
      else if (h === 'is_listing') obj.is_listing = toBool(v);
      else if (h === 'payment_due_day') { const n = toNum(v); if (n !== null) obj.payment_due_day = n; }
      else if (h === 'management_fee_due_day') { const n = toNum(v); if (n !== null) obj.management_fee_due_day = n; }
      else if (h === 'memo') { const c = clean(v); if (c) obj.memo = c; }
      else if (h === 'first_move_in_date') obj.first_move_in_date = toDate(v);
      else if (h === 'renewal_contract_start_date') obj.renewal_contract_start_date = toDate(v);
      else if (h === 'renewal_contract_end_date') obj.renewal_contract_end_date = toDate(v);
      else if (h === 'renewal_deposit') { const n = toNum(v); if (n !== null) obj.renewal_deposit = n; }
      else if (h === 'renewal_rent') { const n = toNum(v); if (n !== null) obj.renewal_rent = n; }
      else if (h === 'renewal_management_fee') { const n = toNum(v); if (n !== null) obj.renewal_management_fee = n; }
    });

    // Remove null date fields
    ['contract_start_date','contract_end_date','move_in_date','move_out_date',
     'pet_discovered_date','first_move_in_date','renewal_contract_start_date','renewal_contract_end_date'
    ].forEach(k => { if (obj[k] === null) delete obj[k]; });

    tenantRows.push(obj);
  }

  // Insert tenants in batches of 50
  console.log(`   ${tenantRows.length}개 임차인 삽입 중... (${skipped}건 매핑실패 스킵)`);
  let totalInserted = 0;
  for (let i = 0; i < tenantRows.length; i += 50) {
    const batch = tenantRows.slice(i, i + 50);
    const { data: inserted, error: tErr } = await supabase
      .from('tenants')
      .insert(batch)
      .select('id');
    if (tErr) {
      console.error(`Tenants batch ${i} 에러:`, tErr);
      // 에러난 행 찾기
      for (let j = 0; j < batch.length; j++) {
        const { error: singleErr } = await supabase.from('tenants').insert(batch[j]).select('id');
        if (singleErr) {
          console.error(`   에러 행: ${batch[j].name} (${batch[j].building_id}/${batch[j].room_id}):`, singleErr.message);
        } else {
          totalInserted++;
        }
      }
      continue;
    }
    totalInserted += inserted.length;
    process.stdout.write(`   ${totalInserted}/${tenantRows.length}...\r`);
  }
  console.log(`   ✅ ${totalInserted}개 임차인 삽입 완료`);

  // ===== 완료 확인 =====
  console.log('\n===== 업로드 완료 =====');
  const { count: bc } = await supabase.from('buildings').select('*', { count: 'exact', head: true });
  const { count: rc } = await supabase.from('rooms').select('*', { count: 'exact', head: true });
  const { count: tc } = await supabase.from('tenants').select('*', { count: 'exact', head: true });
  console.log(`Buildings: ${bc}개`);
  console.log(`Rooms: ${rc}개`);
  console.log(`Tenants: ${tc}개`);
}

main().catch(e => console.error('치명적 에러:', e));
