import { useAppContext } from '@/types/appContext';
import { useContracts, usePastContracts, useTransactions, useSettlementExpenses, useBillingRecords } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { SettlementPage } from '../SettlementPage';

export function SettlementWrapper() {
  const ctx = useAppContext();
  const contractsQ = useContracts();
  const pastContractsQ = usePastContracts();
  const transactionsQ = useTransactions();
  const settlementQ = useSettlementExpenses();
  const billingQ = useBillingRecords();

  return (
    <SettlementPage
      myBuildings={ctx.myBuildings}
      activeTenants={useApiOr(contractsQ.data, ctx.activeTenants)}
      transactions={useApiOr(transactionsQ.data, ctx.transactions)}
      settlementExpenses={useApiOr(settlementQ.data, ctx.settlementExpenses)}
      setSettlementExpenses={USE_API ? undefined : ctx.setSettlementExpenses as any}
      buildingData={ctx.buildingData}
      pastTenantsData={useApiOr(pastContractsQ.data, ctx.pastTenantsData)}
      addCashbookEntry={ctx.addCashbookEntry}
      roomBalances={ctx.roomBalances}
      billingHistory={useApiOr(billingQ.data, ctx.billingHistory)}
      isLoading={USE_API && (contractsQ.isLoading || settlementQ.isLoading)}
    />
  );
}
