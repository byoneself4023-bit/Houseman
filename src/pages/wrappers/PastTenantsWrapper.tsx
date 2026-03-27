import { useAppContext } from '@/types/appContext';
import { PastTenantsPage as _PastTenantsPage } from '../PastTenantsPage';

const PastTenantsPage: React.ComponentType<any> = _PastTenantsPage;

export function PastTenantsWrapper() {
  const ctx = useAppContext();

  return (
    <PastTenantsPage
      myBuildings={ctx.myBuildings}
      pastTenantsData={ctx.pastTenantsData}
      activeTenants={ctx.activeTenants}
    />
  );
}
