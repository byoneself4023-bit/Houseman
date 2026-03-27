import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { USE_API } from '@/lib/featureFlag';

export function useTransactions(buildingId?: number) {
  return useQuery({
    queryKey: ['transactions', { buildingId }],
    queryFn: () =>
      api.get<unknown[]>('/api/transactions', {
        params: buildingId ? { building_id: buildingId } : undefined,
      }),
    enabled: USE_API,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<unknown>('/api/transactions', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });
}
