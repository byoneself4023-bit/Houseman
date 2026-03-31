import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { USE_API } from '@/lib/featureFlag';
import type { VacancyResponse } from '@/types/api';

export function useVacancies(buildingId?: number) {
  return useQuery({
    queryKey: ['vacancies', { buildingId }],
    queryFn: () =>
      api.get<VacancyResponse[]>('/api/vacancies', {
        params: buildingId ? { buildingId } : undefined,
      }),
    enabled: USE_API,
  });
}

export function useCreateVacancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<VacancyResponse>('/api/vacancies', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vacancies'] }),
  });
}

export function useUpdateVacancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      api.put<VacancyResponse>(`/api/vacancies/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vacancies'] }),
  });
}

export function useDeleteVacancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/vacancies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vacancies'] }),
  });
}
