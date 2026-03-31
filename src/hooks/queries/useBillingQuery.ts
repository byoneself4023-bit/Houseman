import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { USE_API } from '@/lib/featureFlag';
import type {
  BillingRecordResponse,
  BillingStatusResponse,
  BillingConfigResponse,
  SettlementMasterResponse,
} from '@/types/api';

export function useBillingRecords(params?: { buildingId?: number; year?: number; month?: number }) {
  return useQuery({
    queryKey: ['billing', 'records', params],
    queryFn: () =>
      api.get<BillingRecordResponse[]>('/api/billing', {
        params: {
          ...(params?.buildingId && { buildingId: params.buildingId }),
          ...(params?.year && { year: params.year }),
          ...(params?.month && { month: params.month }),
        },
      }),
    enabled: USE_API,
  });
}

export function useBillingStatus(params?: { buildingId?: number; year?: number; month?: number }) {
  return useQuery({
    queryKey: ['billing', 'status', params],
    queryFn: () =>
      api.get<BillingStatusResponse>('/api/billing/status', {
        params: {
          ...(params?.buildingId && { buildingId: params.buildingId }),
          ...(params?.year && { year: params.year }),
          ...(params?.month && { month: params.month }),
        },
      }),
    enabled: USE_API,
  });
}

export function useBillingConfigs(buildingId?: number) {
  return useQuery({
    queryKey: ['billing', 'configs', { buildingId }],
    queryFn: () =>
      api.get<BillingConfigResponse[]>('/api/billing/configs', {
        params: buildingId ? { buildingId } : undefined,
      }),
    enabled: USE_API,
  });
}

export function useSettlementMasters() {
  return useQuery({
    queryKey: ['settlement-master'],
    queryFn: () => api.get<SettlementMasterResponse[]>('/api/settlement-master'),
    enabled: USE_API,
  });
}

export function useSettlementMasterByBuilding(buildingId?: number) {
  return useQuery({
    queryKey: ['settlement-master', buildingId],
    queryFn: () => api.get<SettlementMasterResponse>(`/api/settlement-master/${buildingId}`),
    enabled: USE_API && !!buildingId,
  });
}

export function useGenerateBilling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { buildingId: number; periodYear: number; periodMonth: number }) =>
      api.post<BillingRecordResponse[]>('/api/billing/generate', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['billing'] }),
  });
}

export function useConfirmBilling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.put<BillingRecordResponse>(`/api/billing/${id}/confirm`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['billing'] }),
  });
}

export function useSendBilling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.put<BillingRecordResponse>(`/api/billing/${id}/send`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['billing'] }),
  });
}
