/**
 * 건물 상세 Supabase CRUD 래퍼 — feature flag로 분기
 *
 * USE_API=true  → no-op (Spring Boot API는 TanStack Query mutation에서 처리)
 * USE_API=false → Supabase 직접 호출 (대표님 방식)
 */
import { USE_API } from '@/lib/featureFlag';
import {
  updateBuildingPatch,
  updateBuildingDataByName,
  deleteBuilding,
  fetchBuildingStaff,
  upsertBuildingStaff,
  updateRoom,
  findRoom,
} from '@/lib/supabaseData';

/**
 * 건물 정보 저장 → Supabase patch
 * supabaseId 있으면 직접, 없으면 buildingName으로 fallback
 */
export async function persistBuildingPatch(
  supabaseId: string | undefined | null,
  buildingName: string,
  patch: Record<string, any>
) {
  if (USE_API) return;
  try {
    if (supabaseId) {
      await updateBuildingPatch(supabaseId, patch);
    } else {
      await updateBuildingDataByName(buildingName, patch);
    }
  } catch (e) {
    console.error('[buildingDetailApi] persistBuildingPatch 실패:', e);
  }
}

/**
 * 건물 삭제 → Supabase delete (FK cascade: rooms, tenants 등)
 * @returns 성공 여부
 */
export async function persistDeleteBuilding(
  supabaseId: string | undefined | null
): Promise<boolean> {
  if (USE_API || !supabaseId) return true;
  try {
    const ok = await deleteBuilding(supabaseId);
    return !!ok;
  } catch (e) {
    console.error('[buildingDetailApi] persistDeleteBuilding 실패:', e);
    return false;
  }
}

/**
 * 건물 담당자 조회 → Supabase fetch
 * @returns { [role]: name } 매핑
 */
export async function persistFetchStaff(
  supabaseId: string | undefined | null
): Promise<Record<string, string>> {
  if (USE_API || !supabaseId) return {};
  try {
    const rows = await fetchBuildingStaff(supabaseId);
    const map: Record<string, string> = {};
    (rows || []).forEach((r: any) => {
      map[r.assignment_role] = r.assigned_name || '';
    });
    return map;
  } catch (e) {
    console.error('[buildingDetailApi] persistFetchStaff 실패:', e);
    return {};
  }
}

/**
 * 건물 담당자 배정 → Supabase upsert
 */
export async function persistUpsertStaff(
  supabaseId: string | undefined | null,
  role: string,
  name: string,
  phone: string
) {
  if (USE_API || !supabaseId) return;
  try {
    await upsertBuildingStaff(supabaseId, role, name, phone);
  } catch (e) {
    console.error('[buildingDetailApi] persistUpsertStaff 실패:', e);
  }
}

/**
 * 호실 수정 → Supabase update (findRoom → updateRoom)
 */
export async function persistUpdateRoom(
  buildingName: string,
  roomNumber: string,
  patch: Record<string, any>
) {
  if (USE_API) return;
  try {
    const room = await findRoom(buildingName, roomNumber);
    if (room?.id) {
      await updateRoom(room.id, patch);
    }
  } catch (e) {
    console.error('[buildingDetailApi] persistUpdateRoom 실패:', e);
  }
}
