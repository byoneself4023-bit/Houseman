import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { USE_API } from '@/lib/featureFlag';
import type { SettlementExpenseResponse, SettlementCalculationResponse } from '@/types/api';

export function useSettlementExpenses(params?: { buildingId?: number; month?: string }) {
  return useQuery({
    queryKey: ['settlement', 'expenses', params],
    queryFn: () =>
      api.get<SettlementExpenseResponse[]>('/api/settlements/expenses', {
        params: {
          ...(params?.buildingId && { buildingId: params.buildingId }),
          ...(params?.month && { month: params.month }),
        },
      }),
    enabled: USE_API,
  });
}

export function useCreateSettlementExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<SettlementExpenseResponse>('/api/settlements/expenses', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settlement'] }),
  });
}

export function useUpdateSettlementExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      api.put<SettlementExpenseResponse>(`/api/settlements/expenses/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settlement'] }),
  });
}

export function useDeleteSettlementExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/settlements/expenses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settlement'] }),
  });
}

export function useCalculateSettlement() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<SettlementCalculationResponse>('/api/settlements/calculate', data),
  });
}
