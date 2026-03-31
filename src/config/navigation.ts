import type { ViewMode, MenuSection, MenuItem } from '../types';

// 뷰 모드 (사이드바 하단 전환)
export const viewModes: ViewMode[] = [
  { id: 'admin', icon: '🏗️', label: '관리', color: '#3B82F6' },
  { id: 'owner', icon: '🏠', label: '건물주', color: '#A855F7' },
  { id: 'cleaning', icon: '🧹', label: '청소', color: '#EC4899' },
  { id: 'homepage', icon: '🌐', label: '홈페이지', color: '#06B6D4' },
];

export const menuSections: MenuSection[] = [
  {
    section: '현황',
    items: [
      { id: 'task-driver', icon: '✅', label: '오늘 할 일' },
      { id: 'profit-dashboard', icon: '📊', label: '수익 대시보드' },
      { id: 'calendar', icon: '📅', label: '입퇴실일정' },
      { id: 'renewal', icon: '🔄', label: '재계약 관리' },
      { id: 'contracts', icon: '📭', label: '공실 관리' },
      { id: 'transactions', icon: '🏦', label: '입출금 관리' },
      { id: 'cashbook', icon: '📋', label: '출납관리' },
      { id: 'settlement', icon: '💳', label: '건물주 정산' },
    ],
  },
  {
    section: '관리',
    items: [
      { id: 'buildings', icon: '🏢', label: '건물 · 호실정보' },
      { id: 'tenants', icon: '👤', label: '임차인정보' },
      { id: 'pastTenants', icon: '📦', label: '퇴실정보' },
    ],
  },
  {
    section: '운영',
    items: [
      { id: 'collection', icon: '💰', label: '수금 관리' },
      { id: 'billing', icon: '⚡', label: '청구 관리' },
      { id: 'parking', icon: '🅿️', label: '주차 관리' },
      { id: 'as', icon: '🔧', label: 'AS 관리' },
      { id: 'patrol', icon: '🚶', label: '순회 관리' },
      { id: 'route-schedule', icon: '📍', label: '동선 제안' },
    ],
  },
  {
    section: '설정',
    items: [
      { id: 'company-settings', icon: '🏢', label: '하우스맨 기본정보' },
      { id: 'payroll', icon: '💵', label: '급여내역' },
      { id: 'broker', icon: '🏠', label: '부동산 관리' },
      { id: 'staff', icon: '👥', label: '담당자 관리' },
      { id: 'data-upload', icon: '📁', label: '데이터 업로드' },
      { id: 'homepage-edit', icon: '🌐', label: '홈페이지 편집' },
    ],
  },
];

export const menuItems: MenuItem[] = menuSections.flatMap((s) => s.items);

// page id → URL path mapping
export const pageIdToPath: Record<string, string> = {
  calendar: '/calendar',
  buildings: '/buildings',
  tenants: '/tenants',
  pastTenants: '/past-tenants',
  renewal: '/renewal',
  contracts: '/vacancies',
  collection: '/collection',
  billing: '/billing',
  'utility-fixed': '/billing/fixed',
  'utility-variable': '/billing/variable',
  transactions: '/transactions',
  parking: '/parking',
  as: '/as',
  patrol: '/patrol',
  settlement: '/settlement',
  cashbook: '/cashbook',
  payroll: '/payroll',
  'task-driver': '/task-driver',
  'profit-dashboard': '/profit-dashboard',
  'route-schedule': '/route-schedule',
  'company-settings': '/company-settings',
  'data-upload': '/data-upload',
  'homepage-edit': '/homepage-edit',
  homepage: '/homepage',
  staff: '/staff',
  broker: '/broker',
  owner: '/owner',
};
