/**
 * Formats a numeric string into MX money display with 2 decimals.
 * Returns the original input if it's not a valid number.
 */
export function money(v: string): string {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : v;
}

/**
 * Formats an ISO date string to a readable es-MX locale string.
 * Returns the original input if it's not a valid date.
 */
export function dateMX(iso: string): string {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.toLocaleString("es-MX") : iso;
}

/**
 * Parses a string into a number safely. Invalid values become 0.
 */
export function toNumberSafe(v: string): number {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
}

/**
 * Formats a numeric string to 2 decimals. Invalid values become "0.00".
 * Useful for forms and money inputs where you want a stable display.
 */
export function moneySafe(v: string): string {
  const n = toNumberSafe(v);
  return n.toFixed(2);
}
