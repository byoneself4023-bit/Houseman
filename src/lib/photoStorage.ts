/**
 * Supabase Storage 사진 업로드/삭제 유틸
 * 버킷: 'photos' (public)
 * 경로: b{hash}/{room}/{type}/{timestamp}_{index}.jpg
 */

import { supabase } from './supabase';

const BUCKET = 'photos';

export async function uploadPhoto(
  dataUrl: string,
  building: string,
  room: string,
  type: string,
  index = 0
): Promise<string | null> {
  if (!supabase) return null;
  try {
    const base64 = dataUrl.split(',')[1];
    const mime = dataUrl.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
    const byteChars = atob(base64);
    const byteArr = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
    const blob = new Blob([byteArr], { type: mime });

    const ext = mime === 'image/png' ? 'png' : 'jpg';
    const hash = Array.from(new TextEncoder().encode(`${building}_${room}`))
      .reduce((a, b) => ((a << 5) - a + b) | 0, 0)
      .toString(36)
      .replace('-', 'n');
    const path = `b${hash}/${room}/${type}/${Date.now()}_${index}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: mime, upsert: false });

    if (error) {
      console.error('[Storage] 업로드 실패:', error, path);
      return null;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return urlData?.publicUrl || null;
  } catch (e) {
    console.error('[Storage] 업로드 오류:', e);
    return null;
  }
}

export async function uploadPhotos(
  dataUrls: string[],
  building: string,
  room: string,
  type: string
): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < dataUrls.length; i++) {
    const url = await uploadPhoto(dataUrls[i], building, room, type, i);
    if (url) urls.push(url);
  }
  return urls;
}

export async function deletePhoto(publicUrl: string): Promise<void> {
  if (!supabase) return;
  try {
    const match = publicUrl.match(/\/photos\/(.+)$/);
    if (!match) return;
    const path = decodeURIComponent(match[1]);
    await supabase.storage.from(BUCKET).remove([path]);
  } catch (e) {
    console.error('[Storage] 삭제 오류:', e);
  }
}
