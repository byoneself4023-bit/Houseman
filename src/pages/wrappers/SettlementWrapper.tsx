import { useAppContext } from '@/types/appContext';
import { SettlementPage } from '../SettlementPage';

export function SettlementWrapper() {
  const ctx = useAppContext();

  return (
    <SettlementPage
      myBuildings={ctx.myBuildings}
      activeTenants={ctx.activeTenants}
      transactions={ctx.transactions}
      settlementExpenses={ctx.settlementExpenses}
      setSettlementExpenses={ctx.setSettlementExpenses}
      buildingData={ctx.buildingData}
      pastTenantsData={ctx.pastTenantsData}
      addCashbookEntry={ctx.addCashbookEntry}
      roomBalances={ctx.roomBalances}
      billingHistory={ctx.billingHistory}
    />
  );
}
