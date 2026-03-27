import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';

const KEY = 'pageData';

export function useLocalStorage<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || '{}');
      return data[key] !== undefined ? data[key] : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || '{}');
      data[key] = value;
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* quota exceeded — graceful fail */
    }
  }, [key, value]);

  return [value, setValue];
}
