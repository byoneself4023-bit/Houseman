import { useCallback } from 'react';
import { useAppContext } from '@/types/appContext';
import { useContracts, usePastContracts, useTransactions, useSettlementExpenses, useBillingRecords } from '@/hooks/queries';
import { useCreateCashbookEntry } from '@/hooks/queries/useCashbookQuery';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { contractToTenant, transactionResponseToTx, settlementExpenseResponseToExpense, pastContractGroupsToMap, billingRecordToLocal } from '@/lib/transforms';
import { SettlementPage } from '../SettlementPage';

export function SettlementWrapper() {
  const ctx = useAppContext();
  const contractsQ = useContracts();
  const pastContractsQ = usePastContracts();
  const transactionsQ = useTransactions();
  const settlementQ = useSettlementExpenses();
  const billingQ = useBillingRecords();
  const createCashbook = useCreateCashbookEntry();

  const addCashbookViaApi = useCallback(
    (entry: Record<string, any>) => {
      createCashbook.mutate({
        buildingId: entry.buildingId,
        date: entry.date,
        type: entry.type,
        direction: entry.direction || '출금',
        description: entry.description,
        amount: entry.amount,
        account: entry.account,
        accountHolder: entry.accountHolder,
        room: entry.room,
        round: entry.round,
      });
    },
    [createCashbook],
  );

  return (
    <SettlementPage
      myBuildings={ctx.myBuildings}
      activeTenants={useApiOr(contractsQ.data?.map(contractToTenant), ctx.activeTenants)}
      transactions={useApiOr(transactionsQ.data?.map(transactionResponseToTx), ctx.transactions)}
      settlementExpenses={useApiOr(settlementQ.data?.map(settlementExpenseResponseToExpense), ctx.settlementExpenses)}
      setSettlementExpenses={USE_API ? undefined : ctx.setSettlementExpenses as any}
      buildingData={ctx.buildingData}
      pastTenantsData={useApiOr(pastContractsQ.data && pastContractGroupsToMap(pastContractsQ.data), ctx.pastTenantsData)}
      addCashbookEntry={USE_API ? addCashbookViaApi : ctx.addCashbookEntry}
      roomBalances={ctx.roomBalances}
      billingHistory={useApiOr(billingQ.data?.map(billingRecordToLocal), ctx.billingHistory)}
      isLoading={USE_API && (contractsQ.isLoading || settlementQ.isLoading)}
    />
  );
}
