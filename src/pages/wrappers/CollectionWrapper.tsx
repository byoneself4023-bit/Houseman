import { useAppContext } from '@/types/appContext';
import { CollectionPage as _CollectionPage } from '../CollectionPage';

const CollectionPage: React.ComponentType<any> = _CollectionPage;

export function CollectionWrapper() {
  const ctx = useAppContext();

  return (
    <CollectionPage
      myBuildings={ctx.myBuildings}
      roomBalances={ctx.roomBalances}
      activeTenants={ctx.activeTenants}
      lateFeeOverrides={ctx.lateFeeOverrides}
      setLateFeeOverrides={ctx.setLateFeeOverrides}
      buildingAccounts={ctx.buildingAccounts}
      allBuildings={ctx.allBuildings}
      billingHistory={ctx.billingHistory}
    />
  );
}
