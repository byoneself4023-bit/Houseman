import { useAppContext } from '@/types/appContext';
import { useVacancies, useContracts, usePastContracts, useCalendarEvents } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { contractToTenant, vacancyResponseToVacancy, calendarResponseToEvent, pastContractGroupsToMap } from '@/lib/transforms';
import { VacancyPage } from '../VacancyPage';

export function VacancyWrapper() {
  const ctx = useAppContext();
  const vacanciesQ = useVacancies();
  const contractsQ = useContracts();
  const pastContractsQ = usePastContracts();
  const calendarQ = useCalendarEvents();

  return (
    <VacancyPage
      myBuildings={ctx.myBuildings}
      calendarEvts={useApiOr(calendarQ.data?.map(calendarResponseToEvent), ctx.calendarEvts)}
      setCalendarEvts={USE_API ? undefined : ctx.setCalendarEvts as any}
      setPage={ctx.navigateTo}
      setPendingContract={ctx.setPendingContract}
      activeVacancies={useApiOr(vacanciesQ.data?.map(vacancyResponseToVacancy), ctx.activeVacancies)}
      setActiveVacancies={USE_API ? undefined : ctx.setActiveVacancies as any}
      buildingData={ctx.buildingData}
      activeTenants={useApiOr(contractsQ.data?.map(contractToTenant), ctx.activeTenants)}
      setActiveTenants={USE_API ? undefined : ctx.setActiveTenants as any}
      pastTenantsData={useApiOr(pastContractsQ.data && pastContractGroupsToMap(pastContractsQ.data), ctx.pastTenantsData)}
      isLoading={USE_API && (vacanciesQ.isLoading || contractsQ.isLoading)}
    />
  );
}
