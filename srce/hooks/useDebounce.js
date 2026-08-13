import { useEffect, useState } from 'react';

/**
 * Verzoegert die Weitergabe eines sich schnell aendernden Werts,
 * z.B. um bei jedem Tastenanschlag nicht sofort einen API-Call auszuloesen.
 */
export function useDebounce(value, delayMs = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
}