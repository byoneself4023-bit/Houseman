import { useCallback } from 'react';
import { useAppContext } from '@/types/appContext';
import { useContracts, useBillingRecords, useGenerateBilling } from '@/hooks/queries';
import { useApiOr } from '@/hooks/useApiOr';
import { USE_API } from '@/lib/featureFlag';
import { contractToTenant, billingRecordToLocal } from '@/lib/transforms';
import { UtilityBillingPage } from '../UtilityBillingPage';

export function BillingUnifiedWrapper() {
  const ctx = useAppContext();
  const contractsQ = useContracts();
  const billingQ = useBillingRecords();
  const generateMutation = useGenerateBilling();

  const addBilling = useCallback(
    (building: string, room: string, name: string, items: any, total: number) => {
      ctx.addBilling(building, room, name, items, total);
      if (USE_API) {
        const bldg = (ctx.allBuildings || []).find((b: any) => b.building === building || b.buildingName === building) as any;
        const buildingId = bldg?._supabaseId || bldg?.id;
        if (buildingId) {
          const now = new Date();
          generateMutation.mutate({ buildingId: Number(buildingId), periodYear: now.getFullYear(), periodMonth: now.getMonth() + 1 });
        }
      }
    },
    [ctx, generateMutation],
  );

  return (
    <UtilityBillingPage
      billingMode="unified"
      myBuildings={ctx.myBuildings}
      activeTenants={useApiOr(contractsQ.data?.map(contractToTenant), ctx.activeTenants)}
      addBilling={addBilling}
      billingConfirmed={ctx.billingConfirmed}
      setBillingConfirmed={ctx.setBillingConfirmed}
      billingSent={ctx.billingSent}
      setBillingSent={ctx.setBillingSent}
      roomBalances={ctx.roomBalances}
      billingHistory={useApiOr(billingQ.data?.map(billingRecordToLocal), ctx.billingHistory)}
      buildingData={ctx.buildingData}
      isLoading={USE_API && (contractsQ.isLoading || billingQ.isLoading)}
    />
  );
}
