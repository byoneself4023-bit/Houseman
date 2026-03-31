/**
 * 임차인 Supabase CRUD 래퍼 — feature flag로 분기
 *
 * USE_API=true  → no-op (Spring Boot API는 TanStack Query mutation에서 처리)
 * USE_API=false → Supabase 직접 호출 (대표님 방식)
 */
import { USE_API } from '@/lib/featureFlag';
import {
  updateTenant,
  deactivateTenant,
  insertTenant,
  findRoomAndBuilding,
} from '@/lib/supabaseData';

/**
 * 임차인 수정 → Supabase update
 */
export async function persistUpdateTenant(
  supabaseId: string | undefined | null,
  patch: Record<string, any>
) {
  if (USE_API || !supabaseId) return;
  try {
    await updateTenant(supabaseId, patch);
  } catch (e) {
    console.error('[tenantsApi] persistUpdateTenant 실패:', e);
    throw e;
  }
}

/**
 * 임차인 퇴실 비활성화 → Supabase deactivate
 */
export async function persistDeactivateTenant(
  supabaseId: string | undefined | null,
  moveOutDate: string
) {
  if (USE_API || !supabaseId) return;
  try {
    await deactivateTenant(supabaseId, moveOutDate);
  } catch (e) {
    console.error('[tenantsApi] persistDeactivateTenant 실패:', e);
    throw e;
  }
}

/**
 * 신규 임차인 등록 → Supabase insert
 * @returns { data, error } 또는 null (USE_API=true이거나 room 찾기 실패 시)
 */
export async function persistInsertTenant(tenant: Record<string, any>) {
  if (USE_API) return null;
  try {
    const ids = await findRoomAndBuilding(tenant.building, tenant.room);
    if (!ids) {
      console.warn('[tenantsApi] findRoomAndBuilding 실패:', tenant.building, tenant.room);
      return null;
    }
    return await insertTenant({
      ...tenant,
      roomId: ids.roomId,
      buildingId: ids.buildingId,
    });
  } catch (e) {
    console.error('[tenantsApi] persistInsertTenant 실패:', e);
    throw e;
  }
}
