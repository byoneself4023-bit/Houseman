import { useAppContext } from '@/types/appContext';
import { useTransactions, useContracts } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { contractToTenant, transactionResponseToTx } from '@/lib/transforms';
import { TransactionPage } from '../TransactionPage';

export function TransactionWrapper() {
  const ctx = useAppContext();
  const transactionsQ = useTransactions();
  const contractsQ = useContracts();

  return (
    <TransactionPage
      myBuildings={ctx.myBuildings}
      activeTenants={useApiOr(contractsQ.data?.map(contractToTenant), ctx.activeTenants)}
      transactions={useApiOr(transactionsQ.data?.map(transactionResponseToTx), ctx.transactions)}
      addDeposit={ctx.addDeposit}
      roomBalances={ctx.roomBalances}
      isLoading={USE_API && (transactionsQ.isLoading || contractsQ.isLoading)}
    />
  );
}
