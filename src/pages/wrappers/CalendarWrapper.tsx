import { useAppContext } from '@/types/appContext';
import { useContracts, usePastContracts, useVacancies, useCalendarEvents } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { CalendarPage } from '../calendar';

export function CalendarWrapper() {
  const ctx = useAppContext();
  const contractsQ = useContracts();
  const pastContractsQ = usePastContracts();
  const vacanciesQ = useVacancies();
  const calendarQ = useCalendarEvents();

  return (
    <CalendarPage
      events={useApiOr(calendarQ.data, ctx.calendarEvts)}
      setEvents={USE_API ? undefined : ctx.setCalendarEvts as any}
      currentStaff={ctx.currentStaff}
      activeVacancies={useApiOr(vacanciesQ.data, ctx.activeVacancies)}
      setActiveVacancies={USE_API ? undefined : ctx.setActiveVacancies as any}
      activeTenants={useApiOr(contractsQ.data, ctx.activeTenants)}
      setActiveTenants={USE_API ? undefined : ctx.setActiveTenants as any}
      pastTenantsData={useApiOr(pastContractsQ.data, ctx.pastTenantsData)}
      setPastTenantsData={USE_API ? undefined : ctx.setPastTenantsData as any}
      setPage={ctx.navigateTo}
      setPendingMoveout={ctx.setPendingMoveout}
      setPendingContract={ctx.setPendingContract}
      buildingData={ctx.buildingData}
      isLoading={USE_API && (calendarQ.isLoading || contractsQ.isLoading)}
    />
  );
}
