import React, { Suspense } from 'react';
import { Outlet, useMatch, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useIsMobile } from '@/utils/useIsMobile';
import { useNavigateCompat } from '@/hooks/useNavigateCompat';
import { useAppData } from '@/hooks/useAppData';
import { AuthGate } from './AuthGate';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { queryClient } from '@/lib/queryClient';
import type { AppData } from '@/types/appContext';

export function AppLayout() {
  const loggedInId = useAuthStore((s) => s.loggedInId);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const navigateTo = useNavigateCompat();
  const appData = useAppData();
  const buildingMatch = useMatch('/buildings/:name');
  const selectedBuilding = buildingMatch?.params.name ?? null;
  const { pathname } = useLocation();

  if (loggedInId === null) return <AuthGate />;

  const handleLogout = () => {
    useAuthStore.getState().logout();
    queryClient.clear();
    navigate('/calendar');
  };

  const outletContext: AppData = {
    ...appData,
    navigateTo,
  };

  return (
    <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} h-screen bg-[#F3F4F8] overflow-hidden`} style={{ fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {!isMobile && (
        <Sidebar
          currentStaff={appData.currentStaff}
          isGeneral={appData.isGeneral}
          myBuildings={appData.myBuildings}
          menuBadges={appData.menuBadges}
          onLogout={handleLogout}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          currentStaff={appData.currentStaff}
          isGeneral={appData.isGeneral}
          myBuildings={appData.myBuildings}
          selectedBuilding={selectedBuilding}
        />

        <div className={`flex-1 overflow-auto ${isMobile ? 'p-3 pb-[72px]' : 'p-6'}`}>
          <div key={pathname} className="max-w-[1600px] mx-auto" style={{ animation: 'fadeIn 0.3s ease' }}>
            <Suspense fallback={<div className="flex justify-center items-center h-[200px]"><span className="text-sm text-[#8F95A3]">로딩 중...</span></div>}>
              <Outlet context={outletContext} />
            </Suspense>
          </div>
        </div>
      </div>

      {isMobile && (
        <MobileNav
          menuBadges={appData.menuBadges}
          currentStaff={appData.currentStaff}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
