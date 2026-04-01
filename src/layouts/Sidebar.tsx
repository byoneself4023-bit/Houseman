import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { useCurrentPageId } from '@/hooks/useCurrentPageId';
import { useNavigateCompat } from '@/hooks/useNavigateCompat';
import { menuSections } from '@/config/navigation';
import { cn } from '@/lib/utils';
import {
  Calendar, Building2, User, Package, RefreshCw, Mail, Landmark, ClipboardList,
  CreditCard, Coins, Zap, SquareParking, Wrench, Footprints, MapPin,
  Banknote, Home, Users, FolderUp, Globe, CheckSquare, BarChart3,
  Settings, PanelLeftClose, PanelLeft,
} from 'lucide-react';
import type { Staff } from '@/types';

// Map menu item IDs to lucide icons
const iconMap: Record<string, React.ReactNode> = {
  'task-driver': <CheckSquare size={16} />,
  'profit-dashboard': <BarChart3 size={16} />,
  'calendar': <Calendar size={16} />,
  'renewal': <RefreshCw size={16} />,
  'contracts': <Mail size={16} />,
  'transactions': <Landmark size={16} />,
  'cashbook': <ClipboardList size={16} />,
  'settlement': <CreditCard size={16} />,
  'buildings': <Building2 size={16} />,
  'tenants': <User size={16} />,
  'pastTenants': <Package size={16} />,
  'collection': <Coins size={16} />,
  'billing': <Zap size={16} />,
  'parking': <SquareParking size={16} />,
  'as': <Wrench size={16} />,
  'patrol': <Footprints size={16} />,
  'route-schedule': <MapPin size={16} />,
  'payroll': <Banknote size={16} />,
  'broker': <Home size={16} />,
  'staff': <Users size={16} />,
  'data-upload': <FolderUp size={16} />,
  'homepage-edit': <Globe size={16} />,
};

interface SidebarProps {
  currentStaff: Staff | null;
  isGeneral: boolean;
  myBuildings: string[];
  menuBadges: Record<string, number>;
  onLogout: () => void;
}

export function Sidebar({ currentStaff, isGeneral, myBuildings, menuBadges, onLogout }: SidebarProps) {
  const role = useAuthStore((s) => s.role);
  const loggedInId = useAuthStore((s) => s.loggedInId);
  const setRole = useAuthStore((s) => s.setRole);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const settingsOpen = useUiStore((s) => s.settingsOpen);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  const page = useCurrentPageId();
  const navigateTo = useNavigateCompat();

  /** Render a single nav item with left-bar active indicator */
  const renderMenuItem = (m: { id: string; icon: string; label: string }, active: boolean) => (
    <div
      key={m.id}
      onClick={() => navigateTo(m.id)}
      className={cn(
        'flex items-center gap-2.5 rounded-[9px] mb-0.5 cursor-pointer transition-all duration-150',
        sidebarOpen ? 'px-3 py-[9px]' : 'px-2 py-[9px] justify-center',
        active
          ? 'bg-[#2A3352] border-l-[3px] border-hm-blue'
          : 'border-l-[3px] border-transparent hover:bg-[#22273A]',
      )}
    >
      <span className={cn('shrink-0', active ? 'text-white' : 'text-[#A0AEC0]')}>
        {iconMap[m.id] || <span className="text-[16px]">{m.icon}</span>}
      </span>
      {sidebarOpen && (
        <span className={cn('text-xs whitespace-nowrap', active ? 'font-bold text-white' : 'font-medium text-[#A0AEC0]')}>
          {m.label}
        </span>
      )}
      {menuBadges[m.id] > 0 && (
        <span className="ml-auto min-w-[18px] h-[18px] rounded-[9px] bg-[#EF4444] text-white text-[10px] font-extrabold flex items-center justify-center px-[5px] shrink-0">
          {menuBadges[m.id]}
        </span>
      )}
    </div>
  );

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden bg-[#1B1F2E] transition-[width] duration-[250ms] ease-in-out"
      style={{ width: sidebarOpen ? 230 : 64 }}
    >
      {/* Header */}
      <div className={cn('border-b border-[#2A2F42] flex items-center gap-2.5', sidebarOpen ? 'px-3.5 py-2.5' : 'px-3 py-3.5')}>
        <img src="/logo-icon.svg" alt="" className="h-[30px] w-auto shrink-0" />
        {sidebarOpen && (
          <div className="flex-1 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-extrabold text-white tracking-tight">HOUSEMAN</div>
              <div className="text-[10px] text-[#6B7280]">{currentStaff ? currentStaff.name : '건물관리 시스템'} · {isGeneral ? '전체 건물' : `${myBuildings.length}개`}</div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onLogout}
                className="px-2 py-0.5 rounded-[5px] border border-[#374151] bg-transparent text-[#9CA3B0] text-[9px] font-semibold cursor-pointer hover:bg-[#374151]/30 transition-colors"
              >
                로그아웃
              </button>
              <button
                onClick={() => { if (confirm('데이터를 초기화합니다. 계속?')) { localStorage.clear(); location.reload(); } }}
                className="px-2 py-0.5 rounded-[5px] border border-hm-danger bg-transparent text-hm-danger text-[9px] font-semibold cursor-pointer hover:bg-hm-danger/10 transition-colors"
              >
                리셋
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Role tabs */}
      {sidebarOpen && (
        <div className="px-3.5 py-1.5 border-b border-[#2A2F42]">
          <div className="flex gap-[3px]">
            {[{ id: 'admin', icon: '🏗️', label: '관리' }, { id: 'owner', icon: '🏠', label: '건물주' }, { id: 'cleaning', icon: '🧹', label: '청소' }, { id: 'homepage', icon: '🌐', label: '홈페이지' }].map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setRole(r.id);
                  const landingPages: Record<string, string> = { admin: 'calendar', owner: 'owner', cleaning: 'calendar', homepage: 'homepage' };
                  navigateTo(landingPages[r.id] ?? 'calendar');
                }}
                className={cn(
                  'flex-1 py-[5px] px-0.5 rounded-md border-none text-[9px] cursor-pointer transition-colors',
                  role === r.id
                    ? 'bg-[#2A3352] text-white font-bold border-b-2 border-b-hm-blue'
                    : 'bg-transparent text-[#6B7280] font-medium hover:bg-[#2A3352]/50',
                )}
              >
                {r.icon}<br />{r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {role === 'owner' ? null : role === 'cleaning' ? [{ id: 'calendar', icon: '📅', label: '계약/퇴실 일정' }, { id: 'patrol', icon: '🚶', label: '순회 관리' }].map((m) => {
          const active = page === m.id;
          return (
            <div
              key={m.id}
              onClick={() => navigateTo(m.id)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-[9px] cursor-pointer transition-colors duration-150',
                active
                  ? 'bg-[#2A3352] border-l-[3px] border-hm-blue'
                  : 'border-l-[3px] border-transparent hover:bg-[#22273A]',
              )}
            >
              <span className={cn('text-[17px] shrink-0', active ? 'text-white' : 'text-[#A0AEC0]')}>{iconMap[m.id] || m.icon}</span>
              {sidebarOpen && <span className={cn('text-[13px]', active ? 'font-bold text-white' : 'font-medium text-[#A0AEC0]')}>{m.label}</span>}
            </div>
          );
        }) : role === 'homepage' ? [{ id: 'homepage', icon: '🌐', label: '공실 매물' }].map((m) => (
          <div
            key={m.id}
            onClick={() => navigateTo(m.id)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-[9px] cursor-pointer bg-[#2A3352] border-l-[3px] border-hm-blue"
          >
            <Globe size={17} className="text-white shrink-0" />
            {sidebarOpen && <span className="text-[13px] font-bold text-white">{m.label}</span>}
          </div>
        )) : menuSections.map((sec) => {
          if (sec.section === '설정') {
            return (
              <div key={sec.section}>
                <div
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className={cn(
                    'flex items-center cursor-pointer',
                    sidebarOpen ? 'justify-between px-3 pt-3 pb-1' : 'justify-center px-2 py-[9px]',
                  )}
                >
                  {sidebarOpen ? (
                    <>
                      <span className="text-[9px] font-bold text-[#4B5563] tracking-[0.15em] uppercase">{sec.section}</span>
                      <span className={cn('text-[10px] text-[#4B5563] transition-transform duration-200', settingsOpen && 'rotate-180')}>▼</span>
                    </>
                  ) : (
                    <Settings size={16} className="text-[#4B5563]" />
                  )}
                </div>
                {settingsOpen && sec.items.filter((m) => m.id !== 'profit-dashboard' || loggedInId === 1).map((m) => {
                  const active = page === m.id;
                  return renderMenuItem(m, active);
                })}
              </div>
            );
          }
          return (
            <div key={sec.section}>
              {sidebarOpen && <div className="text-[9px] font-bold text-[#4B5563] tracking-[0.15em] px-3 pt-3 pb-1 uppercase">{sec.section}</div>}
              {!sidebarOpen && <div className="border-b border-[#2A2F42] mx-2 my-1.5" />}
              {sec.items.filter((m) => m.id !== 'profit-dashboard' || loggedInId === 1).map((m) => {
                const active = page === m.id;
                return renderMenuItem(m, active);
              })}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle + version */}
      <div className="p-3 border-t border-[#2A2F42]">
        <div
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center justify-center p-2 rounded-lg cursor-pointer text-[#6B7280] transition-colors hover:bg-[#22273A]"
          title={sidebarOpen ? '사이드바 접기' : '사이드바 펼치기'}
        >
          {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
          {sidebarOpen && <span className="ml-2 text-xs">접기</span>}
        </div>
        {sidebarOpen && <div className="text-center text-[8px] text-[#4B5563] mt-1">v2.0</div>}
      </div>
    </div>
  );
}
