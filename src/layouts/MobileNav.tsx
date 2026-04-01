import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { useCurrentPageId } from '@/hooks/useCurrentPageId';
import { useNavigateCompat } from '@/hooks/useNavigateCompat';
import { useIsMobile } from '@/utils/useIsMobile';
import { menuItems } from '@/config/navigation';
import { cn } from '@/lib/utils';
import {
  CheckSquare, BarChart3, Calendar, RefreshCw, Mail, Landmark, ClipboardList,
  CreditCard, Coins, Zap, SquareParking, Wrench, Footprints, MapPin,
  Banknote, Home, Users, FolderUp, Globe, Building2, User, Package,
  MoreHorizontal, LogOut,
} from 'lucide-react';
import type { Staff } from '@/types';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  'task-driver': CheckSquare,
  'profit-dashboard': BarChart3,
  'calendar': Calendar,
  'renewal': RefreshCw,
  'contracts': Mail,
  'transactions': Landmark,
  'cashbook': ClipboardList,
  'settlement': CreditCard,
  'buildings': Building2,
  'tenants': User,
  'pastTenants': Package,
  'collection': Coins,
  'billing': Zap,
  'parking': SquareParking,
  'as': Wrench,
  'patrol': Footprints,
  'route-schedule': MapPin,
  'payroll': Banknote,
  'broker': Home,
  'staff': Users,
  'data-upload': FolderUp,
  'homepage-edit': Globe,
  'homepage': Globe,
  'company-settings': Building2,
};

interface MobileNavProps {
  menuBadges: Record<string, number>;
  currentStaff: Staff | null;
  onLogout: () => void;
}

export function MobileNav({ menuBadges, currentStaff, onLogout }: MobileNavProps) {
  const role = useAuthStore((s) => s.role);
  const loggedInId = useAuthStore((s) => s.loggedInId);
  const showMobileMore = useUiStore((s) => s.showMobileMore);
  const setShowMobileMore = useUiStore((s) => s.setShowMobileMore);
  const page = useCurrentPageId();
  const navigateTo = useNavigateCompat();
  const isMobile = useIsMobile();

  const mobileTabs = role === 'admin' ? [
    { id: 'task-driver', label: '할일' },
    ...(loggedInId === 1 ? [{ id: 'profit-dashboard', label: '수익' }] : []),
    { id: 'tenants', label: '임차인' },
    { id: 'collection', label: '수금' },
    { id: 'as', label: 'AS' },
  ] : role === 'owner' ? [
  ] : role === 'cleaning' ? [
    { id: 'calendar', label: '일정' },
    { id: 'patrol', label: '순회' },
  ] : [{ id: 'homepage', label: '매물' }];

  const mobileMoreItems = role === 'admin' ? menuItems.filter((m) => !mobileTabs.find((t) => t.id === m.id)) : [];

  return (
    <>
      {/* More menu overlay */}
      {showMobileMore && (
        <div onClick={() => setShowMobileMore(false)} className="fixed inset-0 bg-black/30 z-[998]">
          <div onClick={(e) => e.stopPropagation()} className="absolute bottom-[60px] left-2 right-2 bg-white rounded-2xl p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] max-h-[60vh] overflow-y-auto">
            <div className="text-xs font-bold text-hm-text-muted mb-2 px-1">전체 메뉴</div>
            <div className={cn('grid gap-1', isMobile ? 'grid-cols-2' : 'grid-cols-4')}>
              {menuItems.map((m) => {
                const Icon = iconMap[m.id];
                return (
                  <div
                    key={m.id}
                    onClick={() => { navigateTo(m.id); setShowMobileMore(false); }}
                    className={cn(
                      'py-2.5 px-1 rounded-lg text-center cursor-pointer transition-colors flex flex-col items-center gap-1',
                      page === m.id ? 'bg-hm-blue-bg' : 'bg-hm-bg-hover hover:bg-[#F0F2F5]',
                    )}
                  >
                    {Icon ? <Icon size={20} className={page === m.id ? 'text-hm-blue-dark' : 'text-hm-text-sub'} /> : <span className="text-xl">{m.icon}</span>}
                    <div className={cn('text-xs', page === m.id ? 'font-bold text-hm-blue-dark' : 'font-medium text-hm-text-sub')}>{m.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-hm-border mt-2 pt-2 flex justify-between items-center">
              <span className="text-xs text-hm-text-muted flex items-center gap-1">
                <User size={14} /> {currentStaff?.name || '—'}
              </span>
              <button
                onClick={() => { onLogout(); setShowMobileMore(false); }}
                className="px-4 py-1.5 rounded-md border border-hm-input-border bg-white text-xs font-semibold text-hm-danger cursor-pointer hover:bg-hm-danger-bg transition-colors flex items-center gap-1"
              >
                <LogOut size={14} /> 로그아웃
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-lg shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-around z-[999]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {mobileTabs.map((t) => {
          const active = page === t.id;
          const Icon = iconMap[t.id];
          return (
            <div
              key={t.id}
              onClick={() => navigateTo(t.id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-1.5 cursor-pointer active:scale-95 transition-transform duration-100"
            >
              {Icon ? <Icon size={22} className={active ? 'text-hm-primary' : 'text-hm-text-muted'} /> : <span className="text-xl">{t.id}</span>}
              <span className={cn('text-xs', active ? 'font-bold text-hm-primary' : 'font-medium text-hm-text-muted')}>{t.label}</span>
              {active && <div className="w-5 h-0.5 rounded-full bg-hm-primary mt-0.5" />}
            </div>
          );
        })}
        {mobileMoreItems.length > 0 && (
          <div
            onClick={() => setShowMobileMore(!showMobileMore)}
            className="flex-1 flex flex-col items-center gap-0.5 py-1.5 cursor-pointer active:scale-95 transition-transform duration-100"
          >
            <MoreHorizontal size={22} className="text-hm-text-muted" />
            <span className="text-xs font-medium text-hm-text-muted">더보기</span>
          </div>
        )}
      </div>
    </>
  );
}
