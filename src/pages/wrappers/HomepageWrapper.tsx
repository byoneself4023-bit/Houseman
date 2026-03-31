import { useAppContext } from '@/types/appContext';
import { useAuthStore } from '@/stores/authStore';
import { useVacancies, useCalendarEvents } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { vacancyResponseToVacancy, calendarResponseToEvent } from '@/lib/transforms';
import { HomepagePage } from '../HomepagePage';

export function HomepageWrapper() {
  const ctx = useAppContext();
  const role = useAuthStore((s) => s.role);
  const vacanciesQ = useVacancies();
  const calendarQ = useCalendarEvents();

  return (
    <HomepagePage
      buildingData={ctx.buildingData}
      activeVacancies={useApiOr(vacanciesQ.data?.map(vacancyResponseToVacancy), ctx.activeVacancies)}
      calendarEvts={useApiOr(calendarQ.data?.map(calendarResponseToEvent), ctx.calendarEvts)}
      setCalendarEvts={USE_API ? undefined : ctx.setCalendarEvts as any}
      isAdmin={role === 'admin'}
      isLoading={USE_API && (vacanciesQ.isLoading || calendarQ.isLoading)}
    />
  );
}
