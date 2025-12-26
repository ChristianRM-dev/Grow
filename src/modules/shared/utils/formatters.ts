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


/**
 * Formats phone numbers for MX display.
 * - If 10 digits: +52 XXX XXX XXXX
 * - If 12 digits starting with 52: +52 XXX XXX XXXX
 * Otherwise returns original input trimmed.
 */
export function phoneMX(v: string | null | undefined): string {
  const raw = String(v ?? "").trim();
  if (!raw) return "—";

  const digits = raw.replace(/\D/g, "");

  // 10-digit national number
  if (digits.length === 10) {
    const a = digits.slice(0, 3);
    const b = digits.slice(3, 6);
    const c = digits.slice(6, 10);
    return `+52 ${a} ${b} ${c}`;
  }

  // 12 digits with country code 52 + 10 digits
  if (digits.length === 12 && digits.startsWith("52")) {
    const rest = digits.slice(2);
    const a = rest.slice(0, 3);
    const b = rest.slice(3, 6);
    const c = rest.slice(6, 10);
    return `+52 ${a} ${b} ${c}`;
  }

  return raw;
}
