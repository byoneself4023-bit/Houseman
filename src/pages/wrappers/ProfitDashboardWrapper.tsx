import { useAppContext } from '@/types/appContext';
import { useContracts, useVacancies, useBuildings, useSettlementExpenses } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { ProfitDashboardPage } from '../ProfitDashboardPage';

export function ProfitDashboardWrapper() {
  const ctx = useAppContext();
  const contractsQ = useContracts();
  const vacanciesQ = useVacancies();
  const buildingsQ = useBuildings();
  const settlementQ = useSettlementExpenses();

  return (
    <ProfitDashboardPage
      myBuildings={ctx.myBuildings}
      activeTenants={useApiOr(contractsQ.data, ctx.activeTenants)}
      activeVacancies={useApiOr(vacanciesQ.data, ctx.activeVacancies)}
      settlementExpenses={useApiOr(settlementQ.data, ctx.settlementExpenses)}
      buildingData={ctx.buildingData}
      allBuildings={useApiOr(buildingsQ.data, ctx.allBuildings)}
      isLoading={USE_API && (contractsQ.isLoading || vacanciesQ.isLoading)}
    />
  );
}
