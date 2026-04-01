import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { USE_API } from '@/lib/featureFlag';

export interface LateFeeOverrideResponse {
  id: number;
  buildingId: number;
  buildingName: string;
  roomNumber: string;
  overrideType: string;
  amount: number;
  overrideDate: string | null;
}

export function useLateFeeOverrides(buildingId?: number) {
  return useQuery({
    queryKey: ['late-fee-overrides', { buildingId }],
    queryFn: () =>
      api.get<LateFeeOverrideResponse[]>('/api/late-fee-overrides', {
        params: buildingId ? { buildingId } : undefined,
      }),
    enabled: USE_API,
  });
}

export function useCreateLateFeeOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { buildingId: number; roomNumber: string; overrideType: string; amount?: number; overrideDate?: string }) =>
      api.post<LateFeeOverrideResponse>('/api/late-fee-overrides', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['late-fee-overrides'] }),
  });
}

export function useUpdateLateFeeOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; overrideType?: string; amount?: number; overrideDate?: string }) =>
      api.put<LateFeeOverrideResponse>(`/api/late-fee-overrides/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['late-fee-overrides'] }),
  });
}

export function useDeleteLateFeeOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/late-fee-overrides/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['late-fee-overrides'] }),
  });
}
