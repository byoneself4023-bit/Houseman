import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '@/types/appContext';
import { useContracts, usePastContracts } from '@/hooks/queries/useContractQuery';
import { useVacancies } from '@/hooks/queries/useVacancyQuery';
import { useBuildings } from '@/hooks/queries/useBuildingQuery';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { BuildingDetailPage } from '../buildings/detail';

export function BuildingDetailWrapper() {
  const ctx = useAppContext();
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();
  const contractsQ = useContracts();
  const pastContractsQ = usePastContracts();
  const vacanciesQ = useVacancies();
  const buildingsQ = useBuildings();

  return (
    <BuildingDetailPage
      buildingName={name ?? ''}
      onBack={() => navigate('/buildings')}
      buildingAccounts={ctx.buildingAccounts}
      setBuildingAccounts={USE_API ? undefined : ctx.setBuildingAccounts}
      customBuildings={ctx.customBuildings}
      allBuildings={useApiOr(buildingsQ.data, ctx.allBuildings)}
      setAllBuildings={USE_API ? undefined : (ctx.setAllBuildings as any)}
      buildingData={ctx.buildingData}
      setBuildingData={USE_API ? undefined : ctx.setBuildingData}
      activeTenants={useApiOr(contractsQ.data, ctx.activeTenants)}
      activeVacancies={useApiOr(vacanciesQ.data, ctx.activeVacancies)}
      pastTenantsData={useApiOr(pastContractsQ.data, ctx.pastTenantsData)}
      isLoading={USE_API && (contractsQ.isLoading || buildingsQ.isLoading)}
    />
  );
}
