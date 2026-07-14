import { useState, useEffect } from 'react';

function mergeDefaults(obj, defaults) {
  if (typeof defaults !== "object" || defaults === null) {
    return obj ?? defaults;
  }

  const result = { ...obj };

  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in result)) {
      result[key] = value;
    } else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      result[key] = mergeDefaults(result[key], value);
    }
  }

  return result;
}

export function 
useLocalStorageState(key, defaultValue = null) {
  const [state, setState] = useState(() => {
    const stored = localStorage.getItem(key);

    if (stored !== null) {
      return mergeDefaults(JSON.parse(stored), defaultValue);
    }

    return defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}
