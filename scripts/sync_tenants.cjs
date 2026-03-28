/**
 * tenants.json (엑셀 원본) → src/data/tenants.js 동기화 스크립트
 * 실행: node scripts/sync_tenants.cjs
 */
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'output', 'tenants.json');
const jsPath = path.join(__dirname, '..', 'src', 'data', 'tenants.js');

const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Excel serial → Date
function excelSerialToDate(serial) {
  if (!serial || serial === 0) return null;
  const epoch = new Date(1899, 11, 30); // Excel epoch
  const d = new Date(epoch.getTime() + serial * 86400000);
  return d;
}

// due_day(Excel serial) → "M/D" 형식
function formatDue(dueDay) {
  if (!dueDay || dueDay === 0) return '';
  const d = excelSerialToDate(dueDay);
  if (!d || isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// 문자열 이스케이프
function esc(s) {
  if (!s) return '';
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '');
}

const lines = raw.map((t, i) => {
  const id = i + 1;
  const building = esc(t.building_name || '');
  const room = esc(t.room_number || '');
  const name = esc(t.name || '');
  const phone = esc(t.phone || '');
  const rent = t.rent || 0;
  const mgmt = t.mgmt || 0;
  const deposit = t.deposit || 0;
  const due = formatDue(t.due_day);
  const moveIn = esc(t.move_in || '');
  const expiry = esc(t.expiry || '');
  const carNumber = esc(t.car_number_1 || '');

  // 추가 필드 (JSON에만 있는 유용한 데이터)
  const memo = esc(t.memo || '');
  const roomType = esc(t.room_type || '');
  const idNumber = esc(t.id_number || '');
  const rentType = esc(t.rent_type || '');
  const mgmtType = esc(t.mgmt_type || '');
  const waterFee = t.waterFee || 0;
  const waterType = esc(t.water_type || '');
  const cable = t.cable || 0;
  const cableType = esc(t.cable_type || '');
  const cleanFee = t.clean_fee || 0;
  const brokerageFee = t.brokerage_fee || 0;
  const brokerName = esc(t.broker_name || '');
  const brokerPhone = esc(t.broker_phone || '');
  const pet = esc(t.pet || '');
  const payDay = t.pay_day || 0;
  const extraDeposit = t.extra_deposit || 0;

  // 기본 필드
  let fields = `id: ${id}, name: "${name}", building: "${building}", room: "${room}", phone: "${phone}", rent: ${rent}, managementFee: ${mgmt}, deposit: ${deposit}, due: "${due}", overdue: 0, moveIn: "${moveIn}", expiry: "${expiry}"`;

  // 선택 필드 (값 있을 때만)
  if (carNumber) fields += `, carNumber: "${carNumber}"`;
  if (memo) fields += `, memo: "${memo}"`;
  if (roomType) fields += `, roomType: "${roomType}"`;
  if (idNumber) fields += `, idNumber: "${idNumber}"`;
  if (payDay) fields += `, payDay: ${payDay}`;
  if (rentType) fields += `, rentType: "${rentType}"`;
  if (mgmtType) fields += `, mgmtType: "${mgmtType}"`;
  if (waterFee) fields += `, waterFee: ${waterFee}`;
  if (waterType) fields += `, waterType: "${waterType}"`;
  if (cable) fields += `, cable: ${cable}`;
  if (cableType) fields += `, cableType: "${cableType}"`;
  if (cleanFee) fields += `, cleanFee: ${cleanFee}`;
  if (brokerageFee) fields += `, brokerageFee: ${brokerageFee}`;
  if (brokerName) fields += `, brokerName: "${brokerName}"`;
  if (brokerPhone) fields += `, brokerPhone: "${brokerPhone}"`;
  if (pet) fields += `, pet: "${pet}"`;
  if (extraDeposit) fields += `, extraDeposit: ${extraDeposit}`;

  return `  { ${fields} },`;
});

const output = `export const tenants = [\n${lines.join('\n')}\n];\n`;

fs.writeFileSync(jsPath, output, 'utf8');

console.log(`✅ 동기화 완료: ${raw.length}명의 임차인 데이터`);
console.log(`   출력: ${jsPath}`);
