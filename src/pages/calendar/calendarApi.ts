/**
 * 캘린더 CRUD 래퍼 — Supabase 제거됨
 *
 * USE_API=true  → no-op (Spring Boot API는 TanStack Query mutation에서 처리)
 * USE_API=false → no-op (Supabase 삭제됨)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 이벤트 생성 → no-op (API mutation은 컴포넌트에서 직접 호출)
 */
export async function persistInsert(_evt: Record<string, any>): Promise<{ data: any; error: any } | null> {
  return null;
}

/**
 * 이벤트 수정 → no-op
 */
export async function persistUpdate(
  _supabaseId: string | undefined | null,
  _patch: Record<string, any>
) {
  return;
}

/**
 * 이벤트 삭제 → no-op
 */
export async function persistDelete(_supabaseId: string | undefined | null) {
  return;
}

/**
 * 사진 업로드 → no-op (Phase 6에서 별도 스토리지 연결)
 */
export async function persistUploadPhotos(
  _dataUrls: string[],
  _building: string,
  _room: string,
  _type: string
): Promise<string[]> {
  return [];
}

/**
 * 사진 삭제 → no-op
 */
export async function persistDeletePhoto(_publicUrl: string) {
  return;
}
