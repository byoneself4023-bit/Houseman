import { useAppContext } from '@/types/appContext';
import { PatrolPage } from '../PatrolPage';

export function PatrolWrapper() {
  const ctx = useAppContext();

  return (
    <PatrolPage
      myBuildings={ctx.myBuildings}
      buildingData={ctx.buildingData}
      isLoading={false}
    />
  );
}
