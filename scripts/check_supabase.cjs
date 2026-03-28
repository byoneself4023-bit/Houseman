// Supabase 테스트 데이터 확인 스크립트
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dmnppqcpymougyvkmajm.supabase.co',
  'sb_publishable_cNy-sfwm4TQK1nYxEQwDuQ_dyR0Jwen'
);

async function check() {
  console.log('=== Supabase 데이터 확인 ===\n');

  const { data: buildings, error: e1 } = await supabase.from('buildings').select('*');
  if (e1) { console.error('건물 조회 에러:', e1.message); return; }
  console.log(`건물 ${buildings.length}개:`);
  buildings.forEach(b => console.log(`  - [${b.id}] ${b.building_name} (${b.building_nickname}) | 호실 ${b.total_rooms}개 | 수수료 ${b.fee_type} ${b.fee_rate}`));

  const { data: rooms, error: e2 } = await supabase.from('rooms').select('*');
  if (e2) { console.error('호실 조회 에러:', e2.message); return; }
  console.log(`\n호실 ${rooms.length}개:`);
  rooms.forEach(r => console.log(`  - [${r.id}] ${r.room_number}호 | 보증금 ${(r.standard_deposit/10000).toLocaleString()}만 | 월세 ${(r.standard_rent/10000).toLocaleString()}만 | 관리비 ${(r.standard_management_fee/10000).toLocaleString()}만`));

  const { data: tenants, error: e3 } = await supabase.from('tenants').select('*');
  if (e3) { console.error('임차인 조회 에러:', e3.message); return; }
  console.log(`\n임차인 ${tenants.length}명:`);
  tenants.forEach(t => console.log(`  - [${t.id}] ${t.name} (${t.phone}) | 보증금 ${(t.deposit/10000).toLocaleString()}만 | 월세 ${(t.rent/10000).toLocaleString()}만 | 계약 ${t.contract_start_date}~${t.contract_end_date}`));

  console.log('\n✅ 확인 완료!');
}

check();
