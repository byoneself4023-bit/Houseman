import { useState, useEffect } from 'react';

const KEY = "pageData";

export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "{}");
      return data[key] !== undefined ? data[key] : defaultValue;
    } catch { return defaultValue; }
  });

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "{}");
      data[key] = value;
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch { /* quota exceeded — graceful fail */ }
  }, [key, value]);

  return [value, setValue];
}
