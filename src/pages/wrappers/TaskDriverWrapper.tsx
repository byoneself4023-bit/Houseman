import { useAppContext } from '@/types/appContext';
import { TaskDriverPage as _TaskDriverPage } from '../TaskDriverPage';

const TaskDriverPage: React.ComponentType<any> = _TaskDriverPage;

export function TaskDriverWrapper() {
  const ctx = useAppContext();

  return (
    <TaskDriverPage
      myBuildings={ctx.myBuildings}
      activeTenants={ctx.activeTenants}
      activeVacancies={ctx.activeVacancies}
      calendarEvts={ctx.calendarEvts}
      buildingData={ctx.buildingData}
      settlementExpenses={ctx.settlementExpenses}
      roomBalances={ctx.roomBalances}
      billingHistory={ctx.billingHistory}
      pastTenantsData={ctx.pastTenantsData}
      currentStaff={ctx.currentStaff}
    />
  );
}
