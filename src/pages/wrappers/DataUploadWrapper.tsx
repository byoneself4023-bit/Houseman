import { useAppContext } from '@/types/appContext';
import { DataUploadPage } from '../DataUploadPage';

export function DataUploadWrapper() {
  const ctx = useAppContext();

  return (
    <DataUploadPage
      allBuildings={ctx.allBuildings}
      setAllBuildings={ctx.setAllBuildings as any}
      buildingData={ctx.buildingData}
      setBuildingData={ctx.setBuildingData}
      activeTenants={ctx.activeTenants}
      setActiveTenants={ctx.setActiveTenants as any}
      activeVacancies={ctx.activeVacancies}
      setActiveVacancies={ctx.setActiveVacancies as any}
    />
  );
}
