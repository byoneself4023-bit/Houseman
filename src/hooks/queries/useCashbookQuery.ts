import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { USE_API } from '@/lib/featureFlag';
import type { CashbookEntryResponse } from '@/types/api';

export function useCashbookEntries(buildingId?: number) {
  return useQuery({
    queryKey: ['cashbook', { buildingId }],
    queryFn: () =>
      api.get<CashbookEntryResponse[]>('/api/cashbook', {
        params: buildingId ? { buildingId } : undefined,
      }),
    enabled: USE_API,
  });
}

export function useCreateCashbookEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<CashbookEntryResponse>('/api/cashbook', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cashbook'] }),
  });
}

export function useUpdateCashbookEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      api.put<CashbookEntryResponse>(`/api/cashbook/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cashbook'] }),
  });
}

export function useDeleteCashbookEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/cashbook/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cashbook'] }),
  });
}
