import { tenants } from '../data';

let _roomTypeOverrides = {};
export const roomTypeVerRef = { current: null };

export const getRoomType = (building, room) => {
  const key = `${building}_${room}`;
  if (_roomTypeOverrides[key]) return _roomTypeOverrides[key];
  const found = tenants.find(x => x.building === building && x.room === room);
  return found?.type || "단기";
};

export const changeRoomType = (building, room, newType) => {
  _roomTypeOverrides[`${building}_${room}`] = newType;
  const found = tenants.find(x => x.building === building && x.room === room);
  if (found) found.type = newType;
  if (roomTypeVerRef.current) roomTypeVerRef.current(v => v + 1);
};
