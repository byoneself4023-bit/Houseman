import { buildings } from '../data';

export const getStaffBuildings = (staff) => {
  if (!staff || staff.roles.includes("general")) return buildings.map(b => b.name);
  return (staff.assignedBuildings || []);
};

export const fmt = (n) => n?.toLocaleString("ko-KR") ?? "0";

export const feeLabel = (b) => {
  if (b.feeType === "pct" && b.fee > 0) return `수수료 ${(b.fee * 100).toFixed(1)}%`;
  if (b.feeType === "fixed" && b.fixedFee > 0) return `정액 ${fmt(b.fixedFee)}원/월`;
  return "";
};
