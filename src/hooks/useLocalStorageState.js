import { useState, useEffect } from 'react';

export function useLocalStorageState(key, defaultValue = null) {
  const [state, setState] = useState(() => {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      const parsedJSON = JSON.parse(stored);
      for (const [key, value] of Object.entries(defaultValue)) {
        if (!parsedJSON[key]) {
          parsedJSON[key] = value
        }
      }
      return parsedJSON;
    } else {
      return defaultValue
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}
