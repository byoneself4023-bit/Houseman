import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { USE_API } from '@/lib/featureFlag';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export function useSse() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!USE_API || !accessToken) return;

    const es = new EventSource(
      `${API_BASE}/api/sse/connect?token=${accessToken}`,
    );
    esRef.current = es;

    es.addEventListener('CONNECTED', () => {
      console.log('[SSE] connected');
    });

    es.addEventListener('OVERDUE_ALERT', (e) => {
      const data = JSON.parse(e.data);
      toast.warning(`연체 감지: ${data.message}`);
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    });

    es.addEventListener('BILLING_CONFIRMED', (e) => {
      const data = JSON.parse(e.data);
      toast.success(`청구 확정: ${data.message}`);
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    });

    es.addEventListener('CONTRACT_EXPIRING', (e) => {
      const data = JSON.parse(e.data);
      toast.warning(`계약 만료 임박: ${data.message}`);
    });

    es.addEventListener('MOVE_IN_SCHEDULED', (e) => {
      const data = JSON.parse(e.data);
      toast.info(`입주 예정: ${data.message}`);
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    });

    es.addEventListener('MOVE_OUT_SCHEDULED', (e) => {
      const data = JSON.parse(e.data);
      toast.info(`퇴실: ${data.message}`);
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['vacancies'] });
    });

    es.addEventListener('VACANCY_CREATED', (e) => {
      const data = JSON.parse(e.data);
      toast.info(`공실 등록: ${data.message}`);
      queryClient.invalidateQueries({ queryKey: ['vacancies'] });
    });

    es.addEventListener('PAYMENT_RECEIVED', (e) => {
      const data = JSON.parse(e.data);
      toast.success(`입금 확인: ${data.message}`);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    });

    es.onerror = () => {
      console.warn('[SSE] connection error, auto-reconnecting...');
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [accessToken, queryClient]);
}
