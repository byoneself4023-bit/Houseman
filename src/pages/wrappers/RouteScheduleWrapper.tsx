import { useAppContext } from '@/types/appContext';
import { RouteSchedulePage as _RouteSchedulePage } from '../RouteSchedulePage';

const RouteSchedulePage: React.ComponentType<any> = _RouteSchedulePage;

export function RouteScheduleWrapper() {
  const ctx = useAppContext();

  return (
    <RouteSchedulePage
      myBuildings={ctx.myBuildings}
      buildingData={ctx.buildingData}
      activeTenants={ctx.activeTenants}
    />
  );
}
