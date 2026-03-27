import { useAppContext } from '@/types/appContext';
import { useParkingInfos, useContracts } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { ParkingPage } from '../ParkingPage';

export function ParkingWrapper() {
  const ctx = useAppContext();
  const parkingQ = useParkingInfos();
  const contractsQ = useContracts();

  return (
    <ParkingPage
      myBuildings={ctx.myBuildings}
      activeTenants={useApiOr(contractsQ.data, ctx.activeTenants)}
      parkingInfo={useApiOr(parkingQ.data, ctx.parkingInfo)}
      setParkingInfo={USE_API ? undefined : ctx.setParkingInfo as any}
      isLoading={USE_API && (parkingQ.isLoading || contractsQ.isLoading)}
    />
  );
}
