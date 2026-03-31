import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { USE_API } from '@/lib/featureFlag';
import type { ContractResponse, PastContractGroupResponse } from '@/types/api';

export function useContracts(buildingId?: number) {
  return useQuery({
    queryKey: ['contracts', { buildingId }],
    queryFn: () =>
      api.get<ContractResponse[]>('/api/contracts', {
        params: buildingId ? { buildingId } : undefined,
      }),
    enabled: USE_API,
  });
}

export function useContractDetail(id?: number) {
  return useQuery({
    queryKey: ['contracts', id],
    queryFn: () => api.get<ContractResponse>(`/api/contracts/${id}`),
    enabled: USE_API && !!id,
  });
}

export function useExpiringContracts() {
  return useQuery({
    queryKey: ['contracts', 'expiring'],
    queryFn: () => api.get<ContractResponse[]>('/api/contracts/expiring'),
    enabled: USE_API,
  });
}

export function usePastContracts() {
  return useQuery({
    queryKey: ['contracts', 'past'],
    queryFn: () => api.get<PastContractGroupResponse[]>('/api/contracts/past'),
    enabled: USE_API,
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<ContractResponse>('/api/contracts', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  });
}

export function useUpdateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      api.put<ContractResponse>(`/api/contracts/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  });
}

export function useMoveOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      api.post<unknown>(`/api/contracts/${id}/move-out`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      qc.invalidateQueries({ queryKey: ['vacancies'] });
    },
  });
}
