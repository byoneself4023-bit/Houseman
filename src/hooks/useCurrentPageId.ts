import { useLocation } from 'react-router-dom';

const PATH_TO_PAGE: Record<string, string> = {
  '/calendar': 'calendar',
  '/buildings': 'buildings',
  '/tenants': 'tenants',
  '/past-tenants': 'pastTenants',
  '/renewal': 'renewal',
  '/vacancies': 'contracts',
  '/collection': 'collection',
  '/billing': 'billing',
  '/billing/fixed': 'utility-fixed',
  '/billing/variable': 'utility-variable',
  '/transactions': 'transactions',
  '/parking': 'parking',
  '/as': 'as',
  '/patrol': 'patrol',
  '/settlement': 'settlement',
  '/cashbook': 'cashbook',
  '/payroll': 'payroll',
  '/task-driver': 'task-driver',
  '/profit-dashboard': 'profit-dashboard',
  '/route-schedule': 'route-schedule',
  '/data-upload': 'data-upload',
  '/homepage-edit': 'homepage-edit',
  '/homepage': 'homepage',
  '/staff': 'staff',
  '/broker': 'broker',
  '/owner': 'owner',
};

export function useCurrentPageId(): string {
  const { pathname } = useLocation();
  if (pathname.startsWith('/buildings/')) return 'buildings';
  return PATH_TO_PAGE[pathname] || 'calendar';
}
