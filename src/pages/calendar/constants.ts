import { buildings } from '@/data';

// 애니메이션 keyframes
export const WOBBLE_KEYFRAME = `@keyframes hm-wobble { 0%,100% { transform:rotate(0deg); } 25% { transform:rotate(10deg); } 50% { transform:rotate(-5deg); } 75% { transform:rotate(7deg); } }`;

export const TYPE_COLORS: Record<string, string> = { "계약": "var(--color-hm-blue)", "퇴실": "#EF4444", "휴무": "#8B5CF6" };
export const TYPE_BG: Record<string, string> = { "계약": "var(--color-hm-blue-bg)", "퇴실": "var(--color-hm-danger-bg)", "휴무": "#F5F3FF" };
export const TYPE_BORDER: Record<string, string> = { "계약": "#BFDBFE", "퇴실": "var(--color-hm-danger-border)", "휴무": "#DDD6FE" };
export const TYPE_ICON: Record<string, string> = { "계약": "📦", "퇴실": "🚪", "휴무": "🏖️" };
export const STATIC_BUILDING_NAMES: string[] = buildings.map((b: any) => b.name);

export const MSG_TEMPLATES: Record<string, (e: Record<string, any>) => string> = {
  "기본": (e) => [
    `[계약정보 안내]`,
    `건물: ${e.building}`,
    `호실: ${e.room}호`,
    `보증금: ${e.deposit}만원 / 월세: ${e.rent}만원`,
    e.mgmt ? `관리비: ${e.mgmt}만원` : null,
    e.moveIn ? `입주일: ${e.moveIn}` : null,
    e.expiry ? `만기일: ${e.expiry}` : null,
    e.contractDate ? `계약일: ${e.contractDate}` : null,
    e.broker ? `부동산: ${e.broker}` : null,
    e.registeredBy ? `담당: ${e.registeredBy}` : null,
  ].filter(Boolean).join("\n"),
  "상세(단기포함)": (e) => [
    `[계약정보 상세안내]`,
    `━━━━━━━━━━━━━━━`,
    `건물: ${e.building}`,
    `호실: ${e.room}호`,
    `━━━━━━━━━━━━━━━`,
    `보증금: ${e.deposit}만원`,
    `월세: ${e.rent}만원`,
    e.nego ? `NEGO: ${e.nego}만원` : null,
    e.mgmt ? `관리비: ${e.mgmt}만원` : null,
    e.waterFee ? `수도: ${e.waterFee}` : null,
    e.cable ? `인터넷/케이블: ${e.cable}` : null,
    e.exitFee ? `퇴실청소비: ${e.exitFee}만원` : null,
    e.commBroker ? `중개수수료: ${e.commBroker}%` : null,
    `━━━━━━━━━━━━━━━`,
    e.moveIn ? `입주일: ${e.moveIn}` : null,
    e.expiry ? `만기일: ${e.expiry}` : null,
    e.contractDate ? `계약일: ${e.contractDate}` : null,
    `━━━━━━━━━━━━━━━`,
    e.broker ? `부동산: ${e.broker}` : null,
    e.brokerPhone ? `연락처: ${e.brokerPhone}` : null,
    e.registeredBy ? `담당자: ${e.registeredBy}` : null,
  ].filter(Boolean).join("\n"),
  "간단": (e) => [
    `${e.building} ${e.room}호`,
    `보${e.deposit}/월${e.rent}${e.mgmt ? `/관${e.mgmt}` : ""}`,
    e.moveIn ? `입주 ${e.moveIn}` : null,
  ].filter(Boolean).join("\n"),
};

// 건물 계약문자 템플릿에서 금액을 자동 매칭하여 채워넣기
export const fillBuildingContractMsg = (template: string, e: Record<string, any>): string | null => {
  if (!template) return null;
  // 입주금 총합 계산
  const dep = Number(e.deposit) || 0;
  const rent = Number(e.rent) || 0;
  const mgmt = Number(e.mgmt) || 0;
  const water = typeof e.waterFee === "string" && e.waterFee && !isNaN(Number(e.waterFee)) ? Number(e.waterFee) : 0;
  const cable = typeof e.cable === "string" && e.cable && !isNaN(Number(e.cable)) ? Number(e.cable) : 0;
  const exitFee = Number(e.exitFee) || 0;
  const total = dep + rent + mgmt + water + cable;
  // 계약기간
  const period = (e.moveIn && e.expiry) ? `${e.moveIn} ~ ${e.expiry}` : (e.moveIn || "");
  let msg = template;
  // 호수 매칭: "호수 : 제이앤제이  호" → "호수 : 제이앤제이 301호"
  msg = msg.replace(/(호수\s*:\s*\S+)\s+호/, `$1 ${e.room}호`);
  // 부동산 매칭
  msg = msg.replace(/(부동산\s*:)\s*/, `$1 ${e.broker || ""} `);
  // 계약기간 매칭
  msg = msg.replace(/(계약기간\s*:)\s*/, `$1 ${period} `);
  // 입주금 정보 - "만원(관리비/수도/케이블 선불)" 앞에 총합 삽입
  msg = msg.replace(/(\n)만원\(관리비\/수도\/케이블 선불\)/, `\n${total}만원(관리비/수도/케이블 선불)`);
  // 금액 정보 매칭
  msg = msg.replace(/예치금\s*만원/, `예치금 ${dep}만원`);
  msg = msg.replace(/월세\s*만원/, `월세 ${rent}만원`);
  msg = msg.replace(/관리비\s*만원/, `관리비 ${mgmt}만원`);
  msg = msg.replace(/수도\s*만원/, `수도 ${water || e.waterFee || 0}만원`);
  msg = msg.replace(/케이블\s*만원/, `케이블 ${cable || e.cable || 0}만원`);
  msg = msg.replace(/퇴실청소비\s*만원/, `퇴실청소비 ${exitFee}만원`);
  return msg;
};
