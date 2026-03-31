import { useAppContext } from '@/types/appContext';
import { useContracts, useVacancies, useBuildings, useSettlementExpenses } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { contractToTenant, vacancyResponseToVacancy, buildingListToBuilding, settlementExpenseResponseToExpense } from '@/lib/transforms';
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
      activeTenants={useApiOr(contractsQ.data?.map(contractToTenant), ctx.activeTenants)}
      activeVacancies={useApiOr(vacanciesQ.data?.map(vacancyResponseToVacancy), ctx.activeVacancies)}
      settlementExpenses={useApiOr(settlementQ.data?.map(settlementExpenseResponseToExpense), ctx.settlementExpenses)}
      buildingData={ctx.buildingData}
      allBuildings={useApiOr(buildingsQ.data?.map(buildingListToBuilding), ctx.allBuildings)}
      isLoading={USE_API && (contractsQ.isLoading || vacanciesQ.isLoading)}
    />
  );
}
