// src/components/ui/GenericPaginatedTable/helpers.ts

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Resuelve un valor que puede ser estático o una función
 */
export function resolveValue<T, V>(value: V | ((row: T) => V), row: T): V {
  return typeof value === "function" ? (value as (row: T) => V)(row) : value;
}
