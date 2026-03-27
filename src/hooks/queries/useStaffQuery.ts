import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { USE_API } from '@/lib/featureFlag';

interface StaffResponse {
  id: number;
  name: string;
  phone: string;
  roles: string[];
  assigned_buildings: string[];
}

export function useStaff() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: () => api.get<StaffResponse[]>('/api/staff'),
    enabled: USE_API,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; phone: string; password: string; roles?: string[]; assigned_buildings?: string[] }) =>
      api.post<StaffResponse>('/api/staff', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; name?: string; phone?: string; password?: string; roles?: string[]; assigned_buildings?: string[] }) =>
      api.put<StaffResponse>(`/api/staff/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}
