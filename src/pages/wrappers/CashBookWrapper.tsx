import { useAppContext } from '@/types/appContext';
import { useCashbookEntries, useBuildings } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { CashBookPage } from '../CashBookPage';

export function CashBookWrapper() {
  const ctx = useAppContext();
  const cashbookQ = useCashbookEntries();
  const buildingsQ = useBuildings();

  return (
    <CashBookPage
      cashbookEntries={useApiOr(cashbookQ.data, ctx.cashbookEntries)}
      setCashbookEntries={USE_API ? undefined : ctx.setCashbookEntries}
      buildingData={useApiOr(buildingsQ.data, ctx.buildingData)}
      isLoading={USE_API && cashbookQ.isLoading}
    />
  );
}
