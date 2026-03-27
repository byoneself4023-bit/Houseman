import { useAppContext } from '@/types/appContext';
import { useContracts, useBillingRecords } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { UtilityBillingPage } from '../UtilityBillingPage';

export function BillingVariableWrapper() {
  const ctx = useAppContext();
  const contractsQ = useContracts();
  const billingQ = useBillingRecords();

  return (
    <UtilityBillingPage
      billingMode="variable"
      myBuildings={ctx.myBuildings}
      activeTenants={useApiOr(contractsQ.data, ctx.activeTenants)}
      addBilling={ctx.addBilling}
      billingConfirmed={ctx.billingConfirmed}
      setBillingConfirmed={ctx.setBillingConfirmed}
      billingSent={ctx.billingSent}
      setBillingSent={ctx.setBillingSent}
      roomBalances={ctx.roomBalances}
      billingHistory={useApiOr(billingQ.data, ctx.billingHistory)}
      buildingData={ctx.buildingData}
      isLoading={USE_API && (contractsQ.isLoading || billingQ.isLoading)}
    />
  );
}
