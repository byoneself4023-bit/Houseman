import { useAppContext } from '@/types/appContext';
import { ParkingPage as _ParkingPage } from '../ParkingPage';

const ParkingPage: React.ComponentType<any> = _ParkingPage;

export function ParkingWrapper() {
  const ctx = useAppContext();

  return (
    <ParkingPage
      myBuildings={ctx.myBuildings}
      activeTenants={ctx.activeTenants}
      parkingInfo={ctx.parkingInfo}
      setParkingInfo={ctx.setParkingInfo}
    />
  );
}
