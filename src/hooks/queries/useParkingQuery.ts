import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { USE_API } from '@/lib/featureFlag';
import type { ParkingInfoResponse } from '@/types/api';

export function useParkingInfos(buildingId?: number) {
  return useQuery({
    queryKey: ['parking', { buildingId }],
    queryFn: () =>
      api.get<ParkingInfoResponse[]>('/api/parking', {
        params: buildingId ? { buildingId } : undefined,
      }),
    enabled: USE_API,
  });
}

export function useCreateParkingInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<ParkingInfoResponse>('/api/parking', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parking'] }),
  });
}

export function useUpdateParkingInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      api.put<ParkingInfoResponse>(`/api/parking/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parking'] }),
  });
}

export function useDeleteParkingInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/parking/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parking'] }),
  });
}
