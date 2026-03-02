/* ── 공유 설정: 건물 계좌 섹션 공통 ── */
export const modeOptions = {
  "단기": [
    { id: "houseman", label: "하우스맨", desc: "전체금액 하우스맨 계좌" },
    { id: "hm_owner1", label: "건물주계좌1", desc: "제이앤제이식 · 임대료+관리비+공과금→건물주계좌" },
    { id: "owner1", label: "건물주계좌2", desc: "와이원빈티지식 · 임대료→건물주 / 관리비+공과금→하우스맨" },
    { id: "owner2", label: "건물주계좌3", desc: "굿모닝빌식 · 임대료+관리비→건물주 / 공과금→하우스맨" },
  ],
  "일반임대": [
    { id: "gs1", label: "건물주 1개", desc: "임대료+관리비+공과금→건물주계좌" },
    { id: "gs2a", label: "건물주 2개(A)", desc: "임대료→계좌1 / 관리비+공과금→계좌2" },
    { id: "gs2b", label: "건물주 2개(B)", desc: "임대료+관리비→계좌1 / 공과금→계좌2" },
    { id: "gs3", label: "건물주 3개", desc: "임대료→계좌1 / 관리비→계좌2 / 공과금→계좌3" },
  ],
  "근생": [
    { id: "gs1", label: "건물주 1개", desc: "임대료+관리비+공과금→건물주계좌" },
    { id: "gs2a", label: "건물주 2개(A)", desc: "임대료→계좌1 / 관리비+공과금→계좌2" },
    { id: "gs2b", label: "건물주 2개(B)", desc: "임대료+관리비→계좌1 / 공과금→계좌2" },
    { id: "gs3", label: "건물주 3개", desc: "임대료→계좌1 / 관리비→계좌2 / 공과금→계좌3" },
  ],
  "관리사무소": [
    { id: "mgmt_houseman", label: "하우스맨", desc: "전체금액 하우스맨 계좌" },
    { id: "mgmt_building", label: "건물대표계좌", desc: "전체금액 건물 대표계좌" },
  ],
};
export const ownerFieldCfg = {
  houseman: [], hm_owner1: [{ key: "rent", label: "건물주계좌 (임대료+관리비+공과금)" }], owner1: [{ key: "rent", label: "건물주계좌 (임대료)" }], owner2: [{ key: "rent", label: "건물주계좌 (임대료+관리비)" }],
  gs1: [{ key: "rent", label: "건물주계좌" }],
  gs2a: [{ key: "rent", label: "건물주계좌1 (임대료)" }, { key: "mgmt", label: "건물주계좌2 (관리비+공과금)" }],
  gs2b: [{ key: "rent", label: "건물주계좌1 (임대료+관리비)" }, { key: "utility", label: "건물주계좌2 (공과금)" }],
  gs3: [{ key: "rent", label: "계좌1 (임대료)" }, { key: "mgmt", label: "계좌2 (관리비)" }, { key: "utility", label: "계좌3 (공과금)" }],
  mgmt_houseman: [], mgmt_building: [{ key: "representative", label: "건물 대표계좌" }],
};
export const housemanUsageMap = { houseman: "전체", owner1: "관리비+공과금", owner2: "공과금", mgmt_houseman: "전체 수금" };
export const ownerFirstModes = { owner1: true, owner2: true };
export const flowMap = {
  houseman: "임대료+관리비+공과금 → 하우스맨", hm_owner1: "임대료+관리비+공과금 → 건물주계좌", owner1: "임대료→건물주 / 관리비+공과금→하우스맨", owner2: "임대료+관리비→건물주 / 공과금→하우스맨",
  gs1: "전체→건물주계좌", gs2a: "임대료→계좌1 / 관리비+공과금→계좌2", gs2b: "임대료+관리비→계좌1 / 공과금→계좌2", gs3: "임대료→계좌1 / 관리비→계좌2 / 공과금→계좌3",
  mgmt_houseman: "전체→하우스맨", mgmt_building: "전체→건물대표계좌",
};
export const banks = ["하나은행","국민은행","신한은행","우리은행","기업은행","농협","카카오뱅크","토스뱅크","SC제일","씨티은행","수협","대구은행","부산은행","경남은행","광주은행","전북은행","제주은행","새마을금고","신협","우체국"];
export const acctTypeBg = { "단기": "#EFF6FF", "일반임대": "#F0FDF4", "근생": "#FFF7ED", "관리사무소": "#F5F3FF" };
export const acctTypeColor = { "단기": "#2563EB", "일반임대": "#059669", "근생": "#EA580C", "관리사무소": "#7C3AED" };
export const defaultHousemanAccount = "하나은행 225-910048-15704 박종호(하우스맨)";
