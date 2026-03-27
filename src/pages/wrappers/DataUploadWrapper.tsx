import { useAppContext } from '@/types/appContext';
import { DataUploadPage } from '../DataUploadPage';

export function DataUploadWrapper() {
  const ctx = useAppContext();

  return (
    <DataUploadPage
      allBuildings={ctx.allBuildings}
      setAllBuildings={ctx.setAllBuildings}
      buildingData={ctx.buildingData}
      setBuildingData={ctx.setBuildingData}
      activeTenants={ctx.activeTenants}
      setActiveTenants={ctx.setActiveTenants}
      activeVacancies={ctx.activeVacancies}
      setActiveVacancies={ctx.setActiveVacancies}
    />
  );
}
