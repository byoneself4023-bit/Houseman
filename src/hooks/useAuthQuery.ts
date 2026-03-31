import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { USE_API } from '@/lib/featureFlag';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  staff: {
    id: number;
    name: string;
    phone: string;
    roles: string[];
    assignedBuildings: string[];
  };
}

interface StaffResponse {
  id: number;
  name: string;
  phone: string;
  roles: string[];
  assignedBuildings: string[];
}

export function useLogin() {
  return useMutation({
    mutationFn: (data: { phone: string; password: string }) =>
      api.post<LoginResponse>('/api/auth/login', data),
    onSuccess: (data) => {
      useAuthStore.getState().login({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        staff: data.staff,
      });
    },
  });
}

export function useMe() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get<StaffResponse>('/api/auth/me'),
    enabled: USE_API && !!accessToken,
  });
}
