import { useAppContext } from '@/types/appContext';
import { UtilityBillingPage as _UtilityBillingPage } from '../UtilityBillingPage';

const UtilityBillingPage: React.ComponentType<any> = _UtilityBillingPage;

export function BillingFixedWrapper() {
  const ctx = useAppContext();

  return (
    <UtilityBillingPage
      billingMode="fixed"
      myBuildings={ctx.myBuildings}
      activeTenants={ctx.activeTenants}
      addBilling={ctx.addBilling}
      billingConfirmed={ctx.billingConfirmed}
      setBillingConfirmed={ctx.setBillingConfirmed}
      billingSent={ctx.billingSent}
      setBillingSent={ctx.setBillingSent}
      roomBalances={ctx.roomBalances}
      billingHistory={ctx.billingHistory}
      buildingData={ctx.buildingData}
    />
  );
}
