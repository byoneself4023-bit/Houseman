import { useAppContext } from '@/types/appContext';
import { useContracts, usePastContracts, useVacancies, useCalendarEvents, useBillingRecords } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { TenantsPage } from '../tenants';

export function TenantsWrapper() {
  const ctx = useAppContext();
  const contractsQ = useContracts();
  const pastContractsQ = usePastContracts();
  const vacanciesQ = useVacancies();
  const calendarQ = useCalendarEvents();
  const billingQ = useBillingRecords();

  return (
    <TenantsPage
      myBuildings={ctx.myBuildings}
      parkingInfo={ctx.parkingInfo}
      setParkingInfo={USE_API ? undefined : ctx.setParkingInfo}
      pendingContract={ctx.pendingContract}
      setPendingContract={ctx.setPendingContract}
      pendingMoveout={ctx.pendingMoveout}
      setPendingMoveout={ctx.setPendingMoveout}
      buildingAccounts={ctx.buildingAccounts}
      allBuildings={ctx.allBuildings}
      activeTenants={useApiOr(contractsQ.data, ctx.activeTenants)}
      setActiveTenants={USE_API ? undefined : ctx.setActiveTenants as any}
      pastTenantsData={useApiOr(pastContractsQ.data, ctx.pastTenantsData)}
      setPastTenantsData={USE_API ? undefined : ctx.setPastTenantsData as any}
      activeVacancies={useApiOr(vacanciesQ.data, ctx.activeVacancies)}
      setActiveVacancies={USE_API ? undefined : ctx.setActiveVacancies as any}
      calendarEvts={useApiOr(calendarQ.data, ctx.calendarEvts)}
      setCalendarEvts={USE_API ? undefined : ctx.setCalendarEvts as any}
      billingHistory={useApiOr(billingQ.data, ctx.billingHistory)}
      roomBalances={ctx.roomBalances}
      lateFeeOverrides={ctx.lateFeeOverrides}
      buildingData={ctx.buildingData}
      setBuildingData={USE_API ? undefined : ctx.setBuildingData}
      isLoading={USE_API && (contractsQ.isLoading || vacanciesQ.isLoading)}
    />
  );
}
