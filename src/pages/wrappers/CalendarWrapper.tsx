import { useAppContext } from '@/types/appContext';
import { useContracts, usePastContracts, useVacancies, useCalendarEvents } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { contractToTenant, vacancyResponseToVacancy, calendarResponseToEvent, pastContractGroupsToMap } from '@/lib/transforms';
import { CalendarPage } from '../calendar';

export function CalendarWrapper() {
  const ctx = useAppContext();
  const contractsQ = useContracts();
  const pastContractsQ = usePastContracts();
  const vacanciesQ = useVacancies();
  const calendarQ = useCalendarEvents();

  return (
    <CalendarPage
      events={useApiOr(calendarQ.data?.map(calendarResponseToEvent), ctx.calendarEvts)}
      setEvents={USE_API ? undefined : ctx.setCalendarEvts as any}
      currentStaff={ctx.currentStaff}
      activeVacancies={useApiOr(vacanciesQ.data?.map(vacancyResponseToVacancy), ctx.activeVacancies)}
      setActiveVacancies={USE_API ? undefined : ctx.setActiveVacancies as any}
      activeTenants={useApiOr(contractsQ.data?.map(contractToTenant), ctx.activeTenants)}
      setActiveTenants={USE_API ? undefined : ctx.setActiveTenants as any}
      pastTenantsData={useApiOr(pastContractsQ.data && pastContractGroupsToMap(pastContractsQ.data), ctx.pastTenantsData)}
      setPastTenantsData={USE_API ? undefined : ctx.setPastTenantsData as any}
      setPage={ctx.navigateTo}
      setPendingMoveout={ctx.setPendingMoveout}
      setPendingContract={ctx.setPendingContract}
      buildingData={ctx.buildingData}
      allBuildings={ctx.allBuildings}
      isLoading={USE_API && (calendarQ.isLoading || contractsQ.isLoading)}
    />
  );
}
