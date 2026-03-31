import { useAppContext } from '@/types/appContext';
import { useContracts } from '@/hooks/queries/useContractQuery';
import { useVacancies } from '@/hooks/queries/useVacancyQuery';
import { useBuildings } from '@/hooks/queries/useBuildingQuery';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { contractToTenant, vacancyResponseToVacancy, buildingListToBuilding } from '@/lib/transforms';
import { BuildingsPage } from '../BuildingsPage';

export function BuildingsWrapper() {
  const ctx = useAppContext();
  const contractsQ = useContracts();
  const vacanciesQ = useVacancies();
  const buildingsQ = useBuildings();

  return (
    <BuildingsPage
      customBuildings={ctx.customBuildings}
      setCustomBuildings={USE_API ? undefined : ctx.setCustomBuildings}
      allBuildings={useApiOr(buildingsQ.data?.map(buildingListToBuilding), ctx.allBuildings)}
      setAllBuildings={USE_API ? undefined : (ctx.setAllBuildings as any)}
      buildingData={ctx.buildingData}
      activeTenants={useApiOr(contractsQ.data?.map(contractToTenant), ctx.activeTenants)}
      activeVacancies={useApiOr(vacanciesQ.data?.map(vacancyResponseToVacancy), ctx.activeVacancies)}
      isLoading={USE_API && (contractsQ.isLoading || buildingsQ.isLoading)}
    />
  );
}
