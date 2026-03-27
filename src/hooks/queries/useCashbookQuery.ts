import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { USE_API } from '@/lib/featureFlag';

export function useCashbookEntries(buildingId?: number) {
  return useQuery({
    queryKey: ['cashbook', { buildingId }],
    queryFn: () =>
      api.get<unknown[]>('/api/cashbook', {
        params: buildingId ? { building_id: buildingId } : undefined,
      }),
    enabled: USE_API,
  });
}

export function useCreateCashbookEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<unknown>('/api/cashbook', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cashbook'] }),
  });
}

export function useUpdateCashbookEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      api.put<unknown>(`/api/cashbook/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cashbook'] }),
  });
}

export function useDeleteCashbookEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<unknown>(`/api/cashbook/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cashbook'] }),
  });
}
