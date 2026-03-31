import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { USE_API } from '@/lib/featureFlag';
import type { TransactionResponse } from '@/types/api';

export function useTransactions(buildingId?: number) {
  return useQuery({
    queryKey: ['transactions', { buildingId }],
    queryFn: () =>
      api.get<TransactionResponse[]>('/api/transactions', {
        params: buildingId ? { buildingId } : undefined,
      }),
    enabled: USE_API,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<TransactionResponse>('/api/transactions', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });
}
