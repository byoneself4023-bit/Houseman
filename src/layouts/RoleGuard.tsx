import { Outlet, Navigate, useLocation, useOutletContext } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const CLEANING_ALLOWED = new Set(['/calendar', '/patrol']);
const HOMEPAGE_ALLOWED = new Set(['/homepage']);

export function RoleGuard() {
  const role = useAuthStore((s) => s.role);
  const { pathname } = useLocation();
  const ctx = useOutletContext();

  if (role === 'owner' && pathname !== '/owner') {
    return <Navigate to="/owner" replace />;
  }
  if (role === 'cleaning' && !CLEANING_ALLOWED.has(pathname)) {
    return <Navigate to="/calendar" replace />;
  }
  if (role === 'homepage' && !HOMEPAGE_ALLOWED.has(pathname)) {
    return <Navigate to="/homepage" replace />;
  }

  return <Outlet context={ctx} />;
}
