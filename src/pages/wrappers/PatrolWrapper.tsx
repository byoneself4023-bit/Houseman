import { useAppContext } from '@/types/appContext';
import { useBuildings } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { PatrolPage } from '../PatrolPage';

export function PatrolWrapper() {
  const ctx = useAppContext();
  const buildingsQ = useBuildings();

  return (
    <PatrolPage
      myBuildings={ctx.myBuildings}
      buildingData={useApiOr(buildingsQ.data, ctx.buildingData)}
      isLoading={USE_API && buildingsQ.isLoading}
    />
  );
}
