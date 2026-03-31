import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { USE_API } from '@/lib/featureFlag';
import type { CalendarEventResponse } from '@/types/api';

export function useCalendarEvents(params?: { year?: number; month?: number }) {
  return useQuery({
    queryKey: ['calendar', params],
    queryFn: () =>
      api.get<CalendarEventResponse[]>('/api/calendar', {
        params: {
          ...(params?.year && { year: params.year }),
          ...(params?.month && { month: params.month }),
        },
      }),
    enabled: USE_API,
  });
}

export function useCreateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<CalendarEventResponse>('/api/calendar', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] }),
  });
}

export function useUpdateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      api.put<CalendarEventResponse>(`/api/calendar/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] }),
  });
}

export function useDeleteCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/calendar/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] }),
  });
}
