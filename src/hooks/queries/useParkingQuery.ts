import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { USE_API } from '@/lib/featureFlag';

export function useParkingInfos(buildingId?: number) {
  return useQuery({
    queryKey: ['parking', { buildingId }],
    queryFn: () =>
      api.get<unknown[]>('/api/parking', {
        params: buildingId ? { building_id: buildingId } : undefined,
      }),
    enabled: USE_API,
  });
}

export function useCreateParkingInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<unknown>('/api/parking', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parking'] }),
  });
}

export function useUpdateParkingInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      api.put<unknown>(`/api/parking/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parking'] }),
  });
}

export function useDeleteParkingInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<unknown>(`/api/parking/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parking'] }),
  });
}
