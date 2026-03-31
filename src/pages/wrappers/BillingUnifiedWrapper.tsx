import { useAppContext } from '@/types/appContext';
import { useContracts, useBillingRecords } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { contractToTenant, billingRecordToLocal } from '@/lib/transforms';
import { UtilityBillingPage } from '../UtilityBillingPage';

export function BillingUnifiedWrapper() {
  const ctx = useAppContext();
  const contractsQ = useContracts();
  const billingQ = useBillingRecords();

  return (
    <UtilityBillingPage
      billingMode="unified"
      myBuildings={ctx.myBuildings}
      activeTenants={useApiOr(contractsQ.data?.map(contractToTenant), ctx.activeTenants)}
      addBilling={ctx.addBilling}
      billingConfirmed={ctx.billingConfirmed}
      setBillingConfirmed={ctx.setBillingConfirmed}
      billingSent={ctx.billingSent}
      setBillingSent={ctx.setBillingSent}
      roomBalances={ctx.roomBalances}
      billingHistory={useApiOr(billingQ.data?.map(billingRecordToLocal), ctx.billingHistory)}
      buildingData={ctx.buildingData}
      isLoading={USE_API && (contractsQ.isLoading || billingQ.isLoading)}
    />
  );
}
