import { useAppContext } from '@/types/appContext';
import { CashBookPage as _CashBookPage } from '../CashBookPage';

const CashBookPage: React.ComponentType<any> = _CashBookPage;

export function CashBookWrapper() {
  const ctx = useAppContext();

  return (
    <CashBookPage
      cashbookEntries={ctx.cashbookEntries}
      setCashbookEntries={ctx.setCashbookEntries}
      buildingData={ctx.buildingData}
    />
  );
}
