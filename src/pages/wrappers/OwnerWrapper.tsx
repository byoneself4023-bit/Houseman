import { useAppContext } from '@/types/appContext';
import { useContracts, useVacancies } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { contractToTenant, vacancyResponseToVacancy } from '@/lib/transforms';
import { OwnerDashboard } from '../OwnerDashboard';

export function OwnerWrapper() {
  const ctx = useAppContext();
  const contractsQ = useContracts();
  const vacanciesQ = useVacancies();

  return (
    <OwnerDashboard
      activeTenants={useApiOr(contractsQ.data?.map(contractToTenant), ctx.activeTenants)}
      activeVacancies={useApiOr(vacanciesQ.data?.map(vacancyResponseToVacancy), ctx.activeVacancies)}
      isLoading={USE_API && (contractsQ.isLoading || vacanciesQ.isLoading)}
    />
  );
}
