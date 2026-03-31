import { useAppContext } from '@/types/appContext';
import { useCashbookEntries } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { cashbookEntryToLocal } from '@/lib/transforms';
import { CashBookPage } from '../CashBookPage';

export function CashBookWrapper() {
  const ctx = useAppContext();
  const cashbookQ = useCashbookEntries();

  return (
    <CashBookPage
      cashbookEntries={useApiOr(cashbookQ.data?.map(cashbookEntryToLocal), ctx.cashbookEntries)}
      setCashbookEntries={USE_API ? undefined : ctx.setCashbookEntries}
      buildingData={ctx.buildingData}
      isLoading={USE_API && cashbookQ.isLoading}
    />
  );
}
