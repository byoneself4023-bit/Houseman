/**
 * 임차인 CRUD 래퍼 — Supabase 제거됨
 *
 * USE_API=true  → no-op (Spring Boot API는 TanStack Query mutation에서 처리)
 * USE_API=false → no-op (Supabase 삭제됨)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 임차인 수정 → no-op
 */
export async function persistUpdateTenant(
  _supabaseId: string | undefined | null,
  _patch: Record<string, any>
) {
  return;
}

/**
 * 임차인 퇴실 비활성화 → no-op
 */
export async function persistDeactivateTenant(
  _supabaseId: string | undefined | null,
  _moveOutDate: string
) {
  return;
}

/**
 * 신규 임차인 등록 → no-op
 */
export async function persistInsertTenant(_tenant: Record<string, any>): Promise<{ data: any; error: any } | null> {
  return null;
}
