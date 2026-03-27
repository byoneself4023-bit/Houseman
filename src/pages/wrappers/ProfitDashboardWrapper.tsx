import { useAppContext } from '@/types/appContext';
import { ProfitDashboardPage as _ProfitDashboardPage } from '../ProfitDashboardPage';

const ProfitDashboardPage: React.ComponentType<any> = _ProfitDashboardPage;

export function ProfitDashboardWrapper() {
  const ctx = useAppContext();

  return (
    <ProfitDashboardPage
      myBuildings={ctx.myBuildings}
      activeTenants={ctx.activeTenants}
      activeVacancies={ctx.activeVacancies}
      settlementExpenses={ctx.settlementExpenses}
      buildingData={ctx.buildingData}
      allBuildings={ctx.allBuildings}
    />
  );
}
