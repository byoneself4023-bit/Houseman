import { useAppContext } from '@/types/appContext';
import { TransactionPage as _TransactionPage } from '../TransactionPage';

const TransactionPage: React.ComponentType<any> = _TransactionPage;

export function TransactionWrapper() {
  const ctx = useAppContext();

  return (
    <TransactionPage
      myBuildings={ctx.myBuildings}
      activeTenants={ctx.activeTenants}
      transactions={ctx.transactions}
      addDeposit={ctx.addDeposit}
      roomBalances={ctx.roomBalances}
    />
  );
}
