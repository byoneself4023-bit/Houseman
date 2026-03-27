import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { USE_API } from '@/lib/featureFlag';

export function useVacancies(buildingId?: number) {
  return useQuery({
    queryKey: ['vacancies', { buildingId }],
    queryFn: () =>
      api.get<unknown[]>('/api/vacancies', {
        params: buildingId ? { building_id: buildingId } : undefined,
      }),
    enabled: USE_API,
  });
}

export function useCreateVacancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<unknown>('/api/vacancies', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vacancies'] }),
  });
}

export function useUpdateVacancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      api.put<unknown>(`/api/vacancies/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vacancies'] }),
  });
}

export function useDeleteVacancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<unknown>(`/api/vacancies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vacancies'] }),
  });
}
