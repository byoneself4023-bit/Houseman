// 뷰 모드 (사이드바 하단 전환)
export const viewModes = [
  { id: "admin", icon: "🏗️", label: "관리", color: "#3B82F6" },
  { id: "owner", icon: "🏠", label: "건물주", color: "#A855F7" },
  { id: "cleaning", icon: "🧹", label: "청소", color: "#EC4899" },
  { id: "homepage", icon: "🌐", label: "홈페이지", color: "#06B6D4" },
];

export const menuSections = [
  { section: "현황", items: [
    { id: "dashboard", icon: "📊", label: "대시보드" },
    { id: "calendar", icon: "📅", label: "입퇴실일정" },
  ]},
  { section: "관리", items: [
    { id: "buildings", icon: "🏢", label: "건물 · 호실정보" },
    { id: "tenants", icon: "👤", label: "임차인정보" },
    { id: "contracts", icon: "📭", label: "공실 관리" },
    { id: "pastTenants", icon: "📦", label: "퇴실정보" },
    { id: "settlement", icon: "💳", label: "건물주 정산" },
  ]},
  { section: "운영", items: [
    { id: "collection", icon: "💰", label: "수금 관리" },
    { id: "utility", icon: "⚡", label: "공과금 청구" },
    { id: "transactions", icon: "🏦", label: "입출금 관리" },
    { id: "parking", icon: "🅿️", label: "주차 관리" },
    { id: "as", icon: "🔧", label: "AS 관리" },
    { id: "patrol", icon: "🚶", label: "순회 관리" },
  ]},
  { section: "설정", items: [
    { id: "staff", icon: "👥", label: "담당자 관리" },
  ]},
];

export const menuItems = menuSections.flatMap(s => s.items);
