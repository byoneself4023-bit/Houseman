import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const PAGE_TO_PATH: Record<string, string> = {
  calendar: '/calendar',
  buildings: '/buildings',
  tenants: '/tenants',
  pastTenants: '/past-tenants',
  renewal: '/renewal',
  contracts: '/vacancies',
  collection: '/collection',
  billing: '/billing',
  'utility-fixed': '/billing/fixed',
  'utility-variable': '/billing/variable',
  transactions: '/transactions',
  parking: '/parking',
  as: '/as',
  patrol: '/patrol',
  settlement: '/settlement',
  cashbook: '/cashbook',
  payroll: '/payroll',
  'task-driver': '/task-driver',
  'profit-dashboard': '/profit-dashboard',
  'route-schedule': '/route-schedule',
  'company-settings': '/company-settings',
  'data-upload': '/data-upload',
  'homepage-edit': '/homepage-edit',
  homepage: '/homepage',
  staff: '/staff',
  broker: '/broker',
  owner: '/owner',
};

export function useNavigateCompat() {
  const navigate = useNavigate();
  return useCallback(
    (pageId: string) => {
      const path = PAGE_TO_PATH[pageId] || '/';
      navigate(path);
    },
    [navigate],
  );
}
