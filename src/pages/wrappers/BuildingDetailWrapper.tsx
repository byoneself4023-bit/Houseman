import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '@/types/appContext';
import { BuildingDetailPage } from '../BuildingDetailPage';

export function BuildingDetailWrapper() {
  const ctx = useAppContext();
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();

  return (
    <BuildingDetailPage
      buildingName={name ?? ''}
      onBack={() => navigate('/buildings')}
      buildingAccounts={ctx.buildingAccounts}
      setBuildingAccounts={ctx.setBuildingAccounts}
      customBuildings={ctx.customBuildings}
      allBuildings={ctx.allBuildings}
      setAllBuildings={ctx.setAllBuildings}
      buildingData={ctx.buildingData}
      setBuildingData={ctx.setBuildingData}
      activeTenants={ctx.activeTenants}
      activeVacancies={ctx.activeVacancies}
      pastTenantsData={ctx.pastTenantsData}
    />
  );
}
