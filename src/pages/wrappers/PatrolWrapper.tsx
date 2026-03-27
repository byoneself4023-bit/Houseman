import { useAppContext } from '@/types/appContext';
import { PatrolPage as _PatrolPage } from '../PatrolPage';

const PatrolPage: React.ComponentType<any> = _PatrolPage;

export function PatrolWrapper() {
  const ctx = useAppContext();

  return (
    <PatrolPage
      myBuildings={ctx.myBuildings}
      buildingData={ctx.buildingData}
    />
  );
}
