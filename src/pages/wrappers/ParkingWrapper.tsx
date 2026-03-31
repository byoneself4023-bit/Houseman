import { useAppContext } from '@/types/appContext';
import { useParkingInfos, useContracts } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { contractToTenant, parkingArrayToRecord } from '@/lib/transforms';
import { ParkingPage } from '../ParkingPage';

export function ParkingWrapper() {
  const ctx = useAppContext();
  const parkingQ = useParkingInfos();
  const contractsQ = useContracts();

  return (
    <ParkingPage
      myBuildings={ctx.myBuildings}
      activeTenants={useApiOr(contractsQ.data?.map(contractToTenant), ctx.activeTenants)}
      parkingInfo={useApiOr(parkingQ.data && parkingArrayToRecord(parkingQ.data), ctx.parkingInfo)}
      setParkingInfo={USE_API ? undefined : ctx.setParkingInfo as any}
      isLoading={USE_API && (parkingQ.isLoading || contractsQ.isLoading)}
    />
  );
}
