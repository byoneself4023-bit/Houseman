import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/utils/useIsMobile';
import { useCurrentPageId } from '@/hooks/useCurrentPageId';
import { useAuthStore } from '@/stores/authStore';
import { menuItems } from '@/config/navigation';
import { Bell } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Staff } from '@/types';

interface TopBarProps {
  currentStaff: Staff | null;
  isGeneral: boolean;
  myBuildings: string[];
  selectedBuilding: string | null;
}

export function TopBar({ currentStaff, isGeneral, myBuildings, selectedBuilding }: TopBarProps) {
  const [time, setTime] = useState(new Date());
  const isMobile = useIsMobile();
  const page = useCurrentPageId();
  const role = useAuthStore((s) => s.role);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <div className={cn(
        'bg-white border-b border-hm-border flex items-center justify-between shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.05)]',
        isMobile ? 'h-12 px-4' : 'h-[60px] px-6',
      )}>
        {/* Left: page title */}
        <div className={cn('flex items-center', isMobile ? 'gap-2' : 'gap-3')}>
          <span className={isMobile ? 'text-base' : 'text-lg'}>
            {role === 'owner' ? '🏠' : role === 'homepage' ? '🌐' : menuItems.find((m) => m.id === page)?.icon}
          </span>
          <span className={cn('font-bold text-hm-text', isMobile ? 'text-sm' : 'text-base')}>
            {role === 'owner' ? '내 건물 현황' : role === 'homepage' ? '공실 매물' : menuItems.find((m) => m.id === page)?.label}
            {!isMobile && role !== 'owner' && selectedBuilding && (
              <span className="text-hm-text-muted font-medium"> › {selectedBuilding}</span>
            )}
          </span>
        </div>

        {/* Right: staff info, time, bell */}
        <div className={cn('flex items-center', isMobile ? 'gap-2' : 'gap-4')}>
          {!isMobile && currentStaff && (
            <div className={cn(
              'flex items-center gap-2 px-3 py-[5px] rounded-lg border',
              isGeneral ? 'bg-hm-blue-bg border-[#BFDBFE]' : 'bg-[#FEF3C7] border-[#FDE68A]',
            )}>
              <Avatar className="w-7 h-7">
                <AvatarFallback className={cn(
                  'text-xs font-bold',
                  isGeneral ? 'bg-hm-blue text-white' : 'bg-[#F59E0B] text-white',
                )}>
                  {currentStaff.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className={cn('text-xs font-bold', isGeneral ? 'text-hm-blue-dark' : 'text-[#92400E]')}>
                {currentStaff.name}
              </span>
              {!isGeneral && <span className="text-xs text-[#B45309]">({myBuildings.length}건물)</span>}
            </div>
          )}
          <span className="text-xs text-hm-text-muted">
            {time.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
          </span>
          <div className="w-px h-3 bg-hm-input-border" />
          <span className="text-xs text-hm-text-muted">
            {time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="relative cursor-pointer hover:animate-bell-ring">
            <Bell size={isMobile ? 16 : 18} className="text-[#6B7280]" />
            <div className="absolute -top-0.5 -right-1 w-3.5 h-3.5 rounded-full bg-[#EF4444] text-white text-[8px] font-bold flex items-center justify-center">3</div>
          </div>
        </div>
      </div>

      {/* Staff Filter Banner */}
      {currentStaff && !isGeneral && !isMobile && (
        <div className="px-6 py-2 bg-gradient-to-r from-[#FEF3C7] to-hm-warning-bg border-b border-[#FDE68A] flex items-center gap-2">
          <span className="text-xs font-bold text-[#92400E]">📌 {currentStaff.name} · {myBuildings.length}개 건물</span>
          <div className="flex gap-[3px] flex-wrap">
            {myBuildings.map((b) => (
              <span key={b} className="px-2 py-0.5 rounded text-xs font-semibold bg-white text-[#92400E] border border-[#FDE68A]">{b}</span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
