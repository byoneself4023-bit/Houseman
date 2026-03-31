import { useAppContext } from '@/types/appContext';
import { useContracts } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { contractToTenant } from '@/lib/transforms';
import { RenewalPage } from '../RenewalPage';

export function RenewalWrapper() {
  const ctx = useAppContext();
  const contractsQ = useContracts();

  return (
    <RenewalPage
      myBuildings={ctx.myBuildings}
      activeTenants={useApiOr(contractsQ.data?.map(contractToTenant), ctx.activeTenants)}
      isLoading={USE_API && contractsQ.isLoading}
    />
  );
}
