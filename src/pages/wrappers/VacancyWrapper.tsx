import { useAppContext } from '@/types/appContext';
import { VacancyPage as _VacancyPage } from '../VacancyPage';

const VacancyPage: React.ComponentType<any> = _VacancyPage;

export function VacancyWrapper() {
  const ctx = useAppContext();

  return (
    <VacancyPage
      myBuildings={ctx.myBuildings}
      calendarEvts={ctx.calendarEvts}
      setCalendarEvts={ctx.setCalendarEvts}
      setPage={ctx.navigateTo}
      setPendingContract={ctx.setPendingContract}
      activeVacancies={ctx.activeVacancies}
      setActiveVacancies={ctx.setActiveVacancies}
      buildingData={ctx.buildingData}
      activeTenants={ctx.activeTenants}
      setActiveTenants={ctx.setActiveTenants}
      pastTenantsData={ctx.pastTenantsData}
    />
  );
}
