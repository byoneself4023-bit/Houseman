export const expenseCategories = [
  { id: "mgmtFee", label: "관리수수료", type: "auto" },
  { id: "repair", label: "수선비", type: "manual" },
  { id: "utility", label: "공과금(공용)", type: "manual" },
  { id: "cleaning", label: "청소비", type: "manual" },
  { id: "insurance", label: "보험료", type: "manual" },
  { id: "elevator", label: "승강기 유지비", type: "manual" },
  { id: "other", label: "기타 지출", type: "manual" },
];

export const defaultSettlementExpenses = [
  // 스타빌 2월
  { id: 1, month: "2026-02", building: "스타빌", category: "repair", desc: "403호 수도꼭지 교체", amount: 85000 },
  { id: 2, month: "2026-02", building: "스타빌", category: "utility", desc: "공용전기 (2월)", amount: 127000 },
  { id: 3, month: "2026-02", building: "스타빌", category: "cleaning", desc: "건물 청소비 (2월)", amount: 220000 },
  // 아페이론 2월
  { id: 4, month: "2026-02", building: "아페이론", category: "repair", desc: "102호 보일러 수리", amount: 350000 },
  { id: 5, month: "2026-02", building: "아페이론", category: "utility", desc: "공용전기 (2월)", amount: 95000 },
  { id: 6, month: "2026-02", building: "아페이론", category: "cleaning", desc: "건물 청소비 (2월)", amount: 180000 },
  // 스타빌 1월
  { id: 7, month: "2026-01", building: "스타빌", category: "repair", desc: "301호 도어락 교체", amount: 120000 },
  { id: 8, month: "2026-01", building: "스타빌", category: "utility", desc: "공용전기 (1월)", amount: 115000 },
  { id: 9, month: "2026-01", building: "스타빌", category: "cleaning", desc: "건물 청소비 (1월)", amount: 220000 },
];
