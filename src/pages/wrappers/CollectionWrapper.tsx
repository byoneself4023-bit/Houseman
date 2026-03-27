import { useAppContext } from '@/types/appContext';
import { useContracts, useBillingRecords } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { CollectionPage } from '../CollectionPage';

export function CollectionWrapper() {
  const ctx = useAppContext();
  const contractsQ = useContracts();
  const billingQ = useBillingRecords();

  return (
    <CollectionPage
      myBuildings={ctx.myBuildings}
      roomBalances={ctx.roomBalances}
      activeTenants={useApiOr(contractsQ.data, ctx.activeTenants)}
      lateFeeOverrides={ctx.lateFeeOverrides}
      setLateFeeOverrides={ctx.setLateFeeOverrides}
      buildingAccounts={ctx.buildingAccounts}
      allBuildings={ctx.allBuildings}
      billingHistory={useApiOr(billingQ.data, ctx.billingHistory)}
      buildingData={ctx.buildingData}
      isLoading={USE_API && (contractsQ.isLoading || billingQ.isLoading)}
    />
  );
}
