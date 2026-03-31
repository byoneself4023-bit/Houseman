import { useCallback } from 'react';
import { useAppContext } from '@/types/appContext';
import { useTransactions, useContracts } from '@/hooks/queries';
import { useCreateTransaction } from '@/hooks/queries/useTransactionQuery';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { contractToTenant, transactionResponseToTx } from '@/lib/transforms';
import { TransactionPage } from '../TransactionPage';

export function TransactionWrapper() {
  const ctx = useAppContext();
  const transactionsQ = useTransactions();
  const contractsQ = useContracts();
  const createTx = useCreateTransaction();

  const addDepositViaApi = useCallback(
    (building: string, room: string, name: string, amount: number, method: string, note: string) => {
      // buildingId를 contracts 데이터에서 역조회
      const tenant = contractsQ.data?.find(
        (c: any) => c.buildingName === building && c.roomNumber === room
      );
      createTx.mutate({
        buildingId: tenant?.buildingId,
        roomId: tenant?.roomId,
        contractId: tenant?.id,
        tenantName: name,
        type: '입금',
        amount,
        method,
        note,
        date: new Date().toISOString().slice(0, 10),
      });
    },
    [contractsQ.data, createTx],
  );

  return (
    <TransactionPage
      myBuildings={ctx.myBuildings}
      activeTenants={useApiOr(contractsQ.data?.map(contractToTenant), ctx.activeTenants)}
      transactions={useApiOr(transactionsQ.data?.map(transactionResponseToTx), ctx.transactions)}
      addDeposit={USE_API ? addDepositViaApi : ctx.addDeposit}
      roomBalances={ctx.roomBalances}
      isLoading={USE_API && (transactionsQ.isLoading || contractsQ.isLoading)}
    />
  );
}
