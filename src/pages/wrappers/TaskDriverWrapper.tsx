import { useAppContext } from '@/types/appContext';
import { useContracts, usePastContracts, useVacancies, useCalendarEvents, useSettlementExpenses, useBillingRecords } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { contractToTenant, vacancyResponseToVacancy, calendarResponseToEvent, settlementExpenseResponseToExpense, pastContractGroupsToMap, billingRecordToLocal } from '@/lib/transforms';
import { TaskDriverPage } from '../TaskDriverPage';

export function TaskDriverWrapper() {
  const ctx = useAppContext();
  const contractsQ = useContracts();
  const pastContractsQ = usePastContracts();
  const vacanciesQ = useVacancies();
  const calendarQ = useCalendarEvents();
  const settlementQ = useSettlementExpenses();
  const billingQ = useBillingRecords();

  return (
    <TaskDriverPage
      myBuildings={ctx.myBuildings}
      activeTenants={useApiOr(contractsQ.data?.map(contractToTenant), ctx.activeTenants)}
      activeVacancies={useApiOr(vacanciesQ.data?.map(vacancyResponseToVacancy), ctx.activeVacancies)}
      calendarEvts={useApiOr(calendarQ.data?.map(calendarResponseToEvent), ctx.calendarEvts)}
      buildingData={ctx.buildingData}
      settlementExpenses={useApiOr(settlementQ.data?.map(settlementExpenseResponseToExpense), ctx.settlementExpenses)}
      roomBalances={ctx.roomBalances}
      billingHistory={useApiOr(billingQ.data?.map(billingRecordToLocal), ctx.billingHistory)}
      pastTenantsData={useApiOr(pastContractsQ.data && pastContractGroupsToMap(pastContractsQ.data), ctx.pastTenantsData)}
      currentStaff={ctx.currentStaff}
      isLoading={USE_API && (contractsQ.isLoading || vacanciesQ.isLoading)}
    />
  );
}
