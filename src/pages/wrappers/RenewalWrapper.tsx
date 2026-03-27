import { useAppContext } from '@/types/appContext';
import { RenewalPage as _RenewalPage } from '../RenewalPage';

const RenewalPage: React.ComponentType<any> = _RenewalPage;

export function RenewalWrapper() {
  const ctx = useAppContext();

  return (
    <RenewalPage
      myBuildings={ctx.myBuildings}
      activeTenants={ctx.activeTenants}
    />
  );
}
