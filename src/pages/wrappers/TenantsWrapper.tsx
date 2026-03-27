import { useAppContext } from '@/types/appContext';
import { TenantsPage as _TenantsPage } from '../TenantsPage';

const TenantsPage: React.ComponentType<any> = _TenantsPage;

export function TenantsWrapper() {
  const ctx = useAppContext();

  return (
    <TenantsPage
      myBuildings={ctx.myBuildings}
      parkingInfo={ctx.parkingInfo}
      setParkingInfo={ctx.setParkingInfo}
      pendingContract={ctx.pendingContract}
      setPendingContract={ctx.setPendingContract}
      pendingMoveout={ctx.pendingMoveout}
      setPendingMoveout={ctx.setPendingMoveout}
      buildingAccounts={ctx.buildingAccounts}
      allBuildings={ctx.allBuildings}
      activeTenants={ctx.activeTenants}
      setActiveTenants={ctx.setActiveTenants}
      pastTenantsData={ctx.pastTenantsData}
      setPastTenantsData={ctx.setPastTenantsData}
      activeVacancies={ctx.activeVacancies}
      setActiveVacancies={ctx.setActiveVacancies}
      calendarEvts={ctx.calendarEvts}
      setCalendarEvts={ctx.setCalendarEvts}
      billingHistory={ctx.billingHistory}
      roomBalances={ctx.roomBalances}
      lateFeeOverrides={ctx.lateFeeOverrides}
      buildingData={ctx.buildingData}
    />
  );
}
