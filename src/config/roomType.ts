import type { Tenant } from '../types';
import { tenants } from '../data';

const _roomTypeOverrides: Record<string, string> = {};
export const roomTypeVerRef: { current: ((fn: (v: number) => number) => void) | null } = {
  current: null,
};

export const getRoomType = (building: string, room: string): string => {
  const key = `${building}_${room}`;
  if (_roomTypeOverrides[key]) return _roomTypeOverrides[key];
  // 정적 tenants에서 찾기
  const found = tenants.find((x: Tenant) => x.building === building && x.room === room);
  if (found?.type) return found.type;
  // localStorage activeTenants에서 찾기
  try {
    const appData = JSON.parse(localStorage.getItem('appData') || '{}');
    const at = appData['hm_activeTenants'] || [];
    const lt = at.find((x: any) => x.building === building && String(x.room) === String(room));
    if (lt?.type) return lt.type;
  } catch {
    /* localStorage may be unavailable */
  }
  return '단기';
};

export const changeRoomType = (building: string, room: string, newType: string): void => {
  _roomTypeOverrides[`${building}_${room}`] = newType;
  const found = tenants.find((x: Tenant) => x.building === building && x.room === room);
  if (found) (found as any).type = newType;
  if (roomTypeVerRef.current) roomTypeVerRef.current((v) => v + 1);
};
