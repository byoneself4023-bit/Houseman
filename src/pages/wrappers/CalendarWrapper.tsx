import { useAppContext } from '@/types/appContext';
import { CalendarPage as _CalendarPage } from '../CalendarPage';

const CalendarPage: React.ComponentType<any> = _CalendarPage;

export function CalendarWrapper() {
  const ctx = useAppContext();

  return (
    <CalendarPage
      events={ctx.calendarEvts}
      setEvents={ctx.setCalendarEvts}
      currentStaff={ctx.currentStaff}
      activeVacancies={ctx.activeVacancies}
      setActiveVacancies={ctx.setActiveVacancies}
      activeTenants={ctx.activeTenants}
      setActiveTenants={ctx.setActiveTenants}
      pastTenantsData={ctx.pastTenantsData}
      setPastTenantsData={ctx.setPastTenantsData}
      setPage={ctx.navigateTo}
      setPendingMoveout={ctx.setPendingMoveout}
      setPendingContract={ctx.setPendingContract}
      buildingData={ctx.buildingData}
    />
  );
}
