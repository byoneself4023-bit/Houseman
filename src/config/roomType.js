import { tenants } from '../data';

let _roomTypeOverrides = {};
export const roomTypeVerRef = { current: null };

export const getRoomType = (building, room) => {
  const key = `${building}_${room}`;
  if (_roomTypeOverrides[key]) return _roomTypeOverrides[key];
  // 정적 tenants에서 찾기
  const found = tenants.find(x => x.building === building && x.room === room);
  if (found?.type) return found.type;
  // localStorage activeTenants에서 찾기
  try {
    const appData = JSON.parse(localStorage.getItem("appData") || "{}");
    const at = appData["hm_activeTenants"] || [];
    const lt = at.find(x => x.building === building && String(x.room) === String(room));
    if (lt?.type) return lt.type;
  } catch {}
  return "단기";
};

export const changeRoomType = (building, room, newType) => {
  _roomTypeOverrides[`${building}_${room}`] = newType;
  const found = tenants.find(x => x.building === building && x.room === room);
  if (found) found.type = newType;
  if (roomTypeVerRef.current) roomTypeVerRef.current(v => v + 1);
};
