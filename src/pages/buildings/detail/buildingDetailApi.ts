/**
 * 건물 상세 CRUD 래퍼 — Supabase 제거됨
 *
 * USE_API=true  → no-op (Spring Boot API는 TanStack Query mutation에서 처리)
 * USE_API=false → no-op (Supabase 삭제됨)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 건물 정보 저장 → no-op
 */
export async function persistBuildingPatch(
  _supabaseId: string | undefined | null,
  _buildingName: string,
  _patch: Record<string, any>
) {
  return;
}

/**
 * 건물 삭제 → no-op
 */
export async function persistDeleteBuilding(
  _supabaseId: string | undefined | null
): Promise<boolean> {
  return true;
}

/**
 * 건물 담당자 조회 → no-op
 */
export async function persistFetchStaff(
  _supabaseId: string | undefined | null
): Promise<Record<string, string>> {
  return {};
}

/**
 * 건물 담당자 배정 → no-op
 */
export async function persistUpsertStaff(
  _supabaseId: string | undefined | null,
  _role: string,
  _name: string,
  _phone: string
) {
  return;
}

/**
 * 호실 수정 → no-op
 */
export async function persistUpdateRoom(
  _buildingName: string,
  _roomNumber: string,
  _patch: Record<string, any>
) {
  return;
}
