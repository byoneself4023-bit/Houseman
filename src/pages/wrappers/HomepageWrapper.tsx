import { useAppContext } from '@/types/appContext';
import { useAuthStore } from '@/stores/authStore';
import { HomepagePage as _HomepagePage } from '../HomepagePage';

const HomepagePage: React.ComponentType<any> = _HomepagePage;

export function HomepageWrapper() {
  const ctx = useAppContext();
  const role = useAuthStore((s) => s.role);

  return (
    <HomepagePage
      buildingData={ctx.buildingData}
      activeVacancies={ctx.activeVacancies}
      calendarEvts={ctx.calendarEvts}
      setCalendarEvts={ctx.setCalendarEvts}
      isAdmin={role === 'admin'}
    />
  );
}
