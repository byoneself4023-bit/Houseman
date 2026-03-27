import { useAppContext } from '@/types/appContext';
import { OwnerDashboard as _OwnerDashboard } from '../OwnerDashboard';

const OwnerDashboard: React.ComponentType<any> = _OwnerDashboard;

export function OwnerWrapper() {
  const ctx = useAppContext();

  return (
    <OwnerDashboard
      activeTenants={ctx.activeTenants}
      activeVacancies={ctx.activeVacancies}
    />
  );
}
