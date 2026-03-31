import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { USE_API } from '@/lib/featureFlag';
import type { BuildingListResponse, BuildingDetailResponse, RoomResponse } from '@/types/api';

export function useBuildings() {
  return useQuery({
    queryKey: ['buildings'],
    queryFn: () => api.get<BuildingListResponse[]>('/api/buildings'),
    enabled: USE_API,
  });
}

export function useBuildingDetail(id?: number) {
  return useQuery({
    queryKey: ['buildings', id],
    queryFn: () => api.get<BuildingDetailResponse>(`/api/buildings/${id}`),
    enabled: USE_API && !!id,
  });
}

export function useBuildingRooms(buildingId?: number) {
  return useQuery({
    queryKey: ['buildings', buildingId, 'rooms'],
    queryFn: () => api.get<RoomResponse[]>(`/api/buildings/${buildingId}/rooms`),
    enabled: USE_API && !!buildingId,
  });
}

export function useUpdateBuilding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      api.put<BuildingDetailResponse>(`/api/buildings/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['buildings'] }),
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      api.put<RoomResponse>(`/api/rooms/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['buildings'] });
    },
  });
}
