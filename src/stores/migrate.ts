// @ts-nocheck
// 기존 appData localStorage에서 특정 키를 읽어오는 헬퍼
// Zustand persist가 자체 키를 사용하므로, 최초 1회만 기존 데이터에서 마이그레이션

let _appCache = null;

function getAppCache() {
  if (_appCache !== null) return _appCache;
  try {
    const v = localStorage.getItem('appData');
    _appCache = v ? JSON.parse(v) : {};
  } catch {
    _appCache = {};
  }
  return _appCache;
}

export function loadLegacy(key, fallback) {
  try {
    const cache = getAppCache();
    return cache[key] !== undefined ? cache[key] : fallback;
  } catch {
    return fallback;
  }
}
