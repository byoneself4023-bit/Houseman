import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { useCurrentPageId } from '@/hooks/useCurrentPageId';
import { useNavigateCompat } from '@/hooks/useNavigateCompat';
import { useIsMobile } from '@/utils/useIsMobile';
import { menuItems } from '@/config/navigation';
import { cn } from '@/lib/utils';
import type { Staff } from '@/types';

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
    { id: 'task-driver', icon: '✅', label: '할일' },
    ...(loggedInId === 1 ? [{ id: 'profit-dashboard', icon: '📊', label: '수익' }] : []),
    { id: 'tenants', icon: '👤', label: '임차인' },
    { id: 'collection', icon: '💰', label: '수금' },
    { id: 'as', icon: '🔧', label: 'AS' },
  ] : role === 'owner' ? [
  ] : role === 'cleaning' ? [
    { id: 'calendar', icon: '📅', label: '일정' },
    { id: 'patrol', icon: '🚶', label: '순회' },
  ] : [{ id: 'homepage', icon: '🌐', label: '매물' }];

  const mobileMoreItems = role === 'admin' ? menuItems.filter((m) => !mobileTabs.find((t) => t.id === m.id)) : [];

  return (
    <>
      {/* More menu overlay */}
      {showMobileMore && (
        <div onClick={() => setShowMobileMore(false)} className="fixed inset-0 bg-black/30 z-[998]">
          <div onClick={(e) => e.stopPropagation()} className="absolute bottom-[60px] left-2 right-2 bg-white rounded-2xl p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] max-h-[60vh] overflow-y-auto">
            <div className="text-xs font-bold text-[#8F95A3] mb-2 px-1">전체 메뉴</div>
            <div className={cn('grid gap-1', isMobile ? 'grid-cols-2' : 'grid-cols-4')}>
              {menuItems.map((m) => (
                <div
                  key={m.id}
                  onClick={() => { navigateTo(m.id); setShowMobileMore(false); }}
                  className={cn(
                    'py-2.5 px-1 rounded-[10px] text-center cursor-pointer transition-colors',
                    page === m.id ? 'bg-[#EFF6FF]' : 'bg-[#F9FAFB] hover:bg-[#F0F2F5]',
                  )}
                >
                  <div className="text-xl mb-0.5">{m.icon}</div>
                  <div className={cn('text-[10px]', page === m.id ? 'font-bold text-[#2563EB]' : 'font-medium text-[#5F6577]')}>{m.label}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-[#E8ECF0] mt-2 pt-2 flex justify-between items-center">
              <span className="text-[11px] text-[#8F95A3]">👤 {currentStaff?.name || '—'}</span>
              <button
                onClick={() => { onLogout(); setShowMobileMore(false); }}
                className="px-3.5 py-1.5 rounded-md border border-[#E0E3E9] bg-white text-[11px] font-semibold text-[#DC2626] cursor-pointer hover:bg-[#FEF2F2] transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-[#E8ECF0] flex items-center justify-around z-[999]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {mobileTabs.map((t) => {
          const active = page === t.id;
          return (
            <div
              key={t.id}
              onClick={() => navigateTo(t.id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-1.5 cursor-pointer active:scale-95 transition-transform duration-100"
            >
              <span className="text-xl">{t.icon}</span>
              <span className={cn('text-[9px]', active ? 'font-bold text-[#2563EB]' : 'font-medium text-[#8F95A3]')}>{t.label}</span>
              {active && <div className="w-1 h-1 rounded-full bg-[#2563EB] -mt-0.5" />}
            </div>
          );
        })}
        {mobileMoreItems.length > 0 && (
          <div
            onClick={() => setShowMobileMore(!showMobileMore)}
            className="flex-1 flex flex-col items-center gap-0.5 py-1.5 cursor-pointer active:scale-95 transition-transform duration-100"
          >
            <span className="text-xl">⋯</span>
            <span className="text-[9px] font-medium text-[#8F95A3]">더보기</span>
          </div>
        )}
      </div>
    </>
  );
}
