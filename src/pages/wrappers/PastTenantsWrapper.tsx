import { useAppContext } from '@/types/appContext';
import { useContracts, usePastContracts } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { PastTenantsPage } from '../PastTenantsPage';

export function PastTenantsWrapper() {
  const ctx = useAppContext();
  const contractsQ = useContracts();
  const pastContractsQ = usePastContracts();

  return (
    <PastTenantsPage
      myBuildings={ctx.myBuildings}
      pastTenantsData={useApiOr(pastContractsQ.data, ctx.pastTenantsData)}
      activeTenants={useApiOr(contractsQ.data, ctx.activeTenants)}
      isLoading={USE_API && (contractsQ.isLoading || pastContractsQ.isLoading)}
    />
  );
}
