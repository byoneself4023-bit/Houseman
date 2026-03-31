// @ts-nocheck
import { useEffect, useRef } from 'react';

/**
 * 앱 시작 시 1회 실행 — 레거시 localStorage 정리만 수행.
 */
export function useMigrations() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // 레거시 localStorage 키 정리 (Supabase 전환 완료된 항목)
    const legacyKeys = [
      'hm_buildingFloors_override', 'hm_roomMasterData_override',
      'hm_billingHistory', 'hm_transactions',
      'hm_billingConfirmed', 'hm_billingSent',
      'hm_roomBalances', 'hm_editValues',
      'hm_electricCut', 'hm_activeTenants',
      'hm_pastTenantsData',
      'hm_activeVacancies',
    ];
    legacyKeys.forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });

    // appData 내부의 레거시 키도 정리
    try {
      const appData = JSON.parse(localStorage.getItem('appData') || '{}');
      let changed = false;
      ['hm_activeTenants', 'hm_pastTenantsData', 'hm_activeVacancies'].forEach(k => {
        if (appData[k]) { delete appData[k]; changed = true; }
      });
      if (changed) localStorage.setItem('appData', JSON.stringify(appData));
    } catch {}

  }, []);
}
