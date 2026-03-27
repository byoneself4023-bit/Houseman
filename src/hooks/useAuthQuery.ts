import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { USE_API } from '@/lib/featureFlag';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  staff: {
    id: number;
    name: string;
    phone: string;
    roles: string[];
    assigned_buildings: string[];
  };
}

interface StaffResponse {
  id: number;
  name: string;
  phone: string;
  roles: string[];
  assigned_buildings: string[];
}

export function useLogin() {
  return useMutation({
    mutationFn: (data: { phone: string; password: string }) =>
      api.post<LoginResponse>('/api/auth/login', data),
    onSuccess: (data) => {
      useAuthStore.getState().login({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
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
