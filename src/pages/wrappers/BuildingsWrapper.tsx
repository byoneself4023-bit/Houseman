import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/types/appContext';
import { useContracts, useVacancies, useBuildings } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { BuildingsPage } from '../BuildingsPage';

export function BuildingsWrapper() {
  const ctx = useAppContext();
  const navigate = useNavigate();
  const contractsQ = useContracts();
  const vacanciesQ = useVacancies();
  const buildingsQ = useBuildings();

  return (
    <BuildingsPage
      onSelectBuilding={(name: string) => navigate(`/buildings/${name}`)}
      myBuildings={ctx.myBuildings}
      customBuildings={ctx.customBuildings}
      setCustomBuildings={ctx.setCustomBuildings}
      allBuildings={useApiOr(buildingsQ.data, ctx.allBuildings)}
      setAllBuildings={USE_API ? undefined : ctx.setAllBuildings as any}
      activeTenants={useApiOr(contractsQ.data, ctx.activeTenants)}
      activeVacancies={useApiOr(vacanciesQ.data, ctx.activeVacancies)}
      buildingData={ctx.buildingData}
      setBuildingData={ctx.setBuildingData}
      parkingInfo={ctx.parkingInfo}
      isLoading={USE_API && (contractsQ.isLoading || vacanciesQ.isLoading)}
    />
  );
}
