import { useAppContext } from '@/types/appContext';
import { useCalendarEvents } from '@/hooks/queries/useCalendarQuery';
import { useApiOr } from '@/hooks/useApiOr';
import { calendarResponseToEvent } from '@/lib/transforms';
import { BrokerPage } from '../BrokerPage';

export function BrokerWrapper() {
  const ctx = useAppContext();
  const calendarQ = useCalendarEvents();

  return (
    <BrokerPage
      calendarEvts={useApiOr(calendarQ.data?.map(calendarResponseToEvent), ctx.calendarEvts)}
    />
  );
}
