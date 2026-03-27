import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/types/appContext';
import { BuildingsPage as _BuildingsPage } from '../BuildingsPage';

const BuildingsPage: React.ComponentType<any> = _BuildingsPage;

export function BuildingsWrapper() {
  const ctx = useAppContext();
  const navigate = useNavigate();

  return (
    <BuildingsPage
      onSelectBuilding={(name: string) => navigate(`/buildings/${name}`)}
      myBuildings={ctx.myBuildings}
      customBuildings={ctx.customBuildings}
      setCustomBuildings={ctx.setCustomBuildings}
      allBuildings={ctx.allBuildings}
      setAllBuildings={ctx.setAllBuildings}
      activeTenants={ctx.activeTenants}
      activeVacancies={ctx.activeVacancies}
    />
  );
}
