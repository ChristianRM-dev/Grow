/**
 * useDebounce Hook
 *
 * Debounces a value, delaying updates until after a specified delay.
 * Useful for reducing API calls, expensive computations, or auto-save operations.
 *
 * @example
 * ```typescript
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     performSearch(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 * ```
 */

import { useEffect, useState } from "react";

/**
 * Debounce a value
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function - cancel the timeout if value changes before delay elapses
    // or if component unmounts
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce a callback function
 *
 * Returns a memoized debounced callback that delays invoking the provided
 * function until after the specified delay has elapsed since the last time
 * the debounced function was invoked.
 *
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @param deps - Dependency array for the callback (like useCallback)
 * @returns A debounced version of the callback
 *
 * @example
 * ```typescript
 * const handleSearch = useDebouncedCallback(
 *   (term: string) => {
 *     performSearch(term);
 *   },
 *   500,
 *   []
 * );
 *
 * // In your component:
 * <input onChange={(e) => handleSearch(e.target.value)} />
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500,
  deps: React.DependencyList = []
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup on unmount or deps change
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  return (...args: Parameters<T>) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };
}
