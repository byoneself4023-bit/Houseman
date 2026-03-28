/**
 * 캘린더 Supabase CRUD 래퍼 — feature flag로 분기
 *
 * USE_API=true  → no-op (Spring Boot API는 TanStack Query mutation에서 처리)
 * USE_API=false → Supabase 직접 호출 (대표님 방식)
 */
import { USE_API } from '@/lib/featureFlag';
import {
  insertCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '@/lib/supabaseData';
import { uploadPhotos, deletePhoto } from '@/lib/photoStorage';

/**
 * 이벤트 생성 → Supabase insert
 * @returns { data, error } 또는 null (USE_API=true일 때)
 */
export async function persistInsert(evt: Record<string, any>) {
  if (USE_API) return null;
  try {
    const result = await insertCalendarEvent(evt);
    return result;
  } catch (e) {
    console.error('[calendarApi] persistInsert 실패:', e);
    return { data: null, error: e };
  }
}

/**
 * 이벤트 수정 → Supabase update
 */
export async function persistUpdate(
  supabaseId: string | undefined | null,
  patch: Record<string, any>
) {
  if (USE_API || !supabaseId) return;
  try {
    await updateCalendarEvent(supabaseId, patch);
  } catch (e) {
    console.error('[calendarApi] persistUpdate 실패:', e);
  }
}

/**
 * 이벤트 삭제 → Supabase delete
 */
export async function persistDelete(supabaseId: string | undefined | null) {
  if (USE_API || !supabaseId) return;
  try {
    await deleteCalendarEvent(supabaseId);
  } catch (e) {
    console.error('[calendarApi] persistDelete 실패:', e);
  }
}

/**
 * 사진 업로드 → Supabase Storage
 * @returns 업로드된 사진 URL 배열
 */
export async function persistUploadPhotos(
  dataUrls: string[],
  building: string,
  room: string,
  type: string
): Promise<string[]> {
  if (USE_API) return [];
  try {
    return await uploadPhotos(dataUrls, building, room, type);
  } catch (e) {
    console.error('[calendarApi] persistUploadPhotos 실패:', e);
    return [];
  }
}

/**
 * 사진 삭제 → Supabase Storage
 */
export async function persistDeletePhoto(publicUrl: string) {
  if (USE_API) return;
  try {
    await deletePhoto(publicUrl);
  } catch (e) {
    console.error('[calendarApi] persistDeletePhoto 실패:', e);
  }
}
