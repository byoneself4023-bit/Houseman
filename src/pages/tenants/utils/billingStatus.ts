import { getRoomType } from '@/config';

// 월세일(입주일 기준) 연체 상태 계산
// 청구 발생 이후에만 미납 판정 — roomBalances 기반
const today = new Date();
export const getBillingStatus = (r: Record<string, any>, roomBalances: Record<string, number> = {}) => {
  const key = `${r.building}_${r.room}`;
  const balance = roomBalances[key] || 0;
  // 청구된 잔액이 없으면 미납 아님
  if (balance <= 0) return { label: "정상", days: 0, balance: 0 };
  // 월세일 = 입주일의 day, 없으면 due에서 추출
  const rentDay = r.moveIn ? new Date(r.moveIn).getDate() : (r.due ? parseInt(r.due.replace(/\D/g, "")) || 1 : 1);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), rentDay);
  const rentDate = thisMonth <= today ? thisMonth : new Date(today.getFullYear(), today.getMonth() - 1, rentDay);
  const diffDays = Math.floor((today.getTime() - rentDate.getTime()) / 86400000);
  // 월세일 이전: 청구는 됐지만 아직 납부 기한 내
  if (diffDays <= 0) return { label: "청구", days: 0, balance };
  // 월세일 당일부터 미납
  return { label: `연체${diffDays}일`, days: diffDays, balance };
};

// 단기 연체수수료 계산 (연체 5일차부터 임대료의 월 5%)
// lateFeeOverrides로 할인/제외 가능
export const getLateFee = (r: Record<string, any>, roomBalances: Record<string, number> = {}, lateFeeOverrides: Record<string, any> = {}) => {
  const bs = getBillingStatus(r, roomBalances);
  if (bs.days < 5) return 0;
  if (getRoomType(r.building, r.room) !== "단기") return 0;
  const key = `${r.building}_${r.room}`;
  const override = lateFeeOverrides[key];
  if (override?.type === "exclude") return 0;
  const baseFee = Math.round((r.rent || 0) * 0.05);
  if (override?.type === "discount") return Math.max(0, baseFee - (override.amount || 0));
  return baseFee;
};
