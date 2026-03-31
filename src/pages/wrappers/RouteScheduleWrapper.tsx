import { useAppContext } from '@/types/appContext';
import { useContracts } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { contractToTenant } from '@/lib/transforms';
import { RouteSchedulePage } from '../RouteSchedulePage';

export function RouteScheduleWrapper() {
  const ctx = useAppContext();
  const contractsQ = useContracts();

  return (
    <RouteSchedulePage
      myBuildings={ctx.myBuildings}
      buildingData={ctx.buildingData}
      activeTenants={useApiOr(contractsQ.data?.map(contractToTenant), ctx.activeTenants)}
      isLoading={USE_API && contractsQ.isLoading}
    />
  );
}
