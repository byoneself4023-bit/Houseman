import { useAppContext } from '@/types/appContext';
import { useBuildings, useContracts } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { RouteSchedulePage } from '../RouteSchedulePage';

export function RouteScheduleWrapper() {
  const ctx = useAppContext();
  const buildingsQ = useBuildings();
  const contractsQ = useContracts();

  return (
    <RouteSchedulePage
      myBuildings={ctx.myBuildings}
      buildingData={useApiOr(buildingsQ.data, ctx.buildingData)}
      activeTenants={useApiOr(contractsQ.data, ctx.activeTenants)}
      isLoading={USE_API && (buildingsQ.isLoading || contractsQ.isLoading)}
    />
  );
}
