/**
 * Formats a numeric string into MX money display with 2 decimals.
 * Returns the original input if it's not a valid number.
 */
export function money(v: string | number): string {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : v.toString();
}

/**
 * Formats an ISO date string to a readable es-MX locale string.
 * Returns the original input if it's not a valid date.
 */
const DATE_TIME_MX = new Intl.DateTimeFormat("es-MX", {
  timeZone: "America/Mexico_City",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
});

export function dateMX(iso: string): string {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? DATE_TIME_MX.format(d) : iso;
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

const MONTHS_ES_MX = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

/**
 * Converts a month number (1-12) into a Spanish month name (es-MX).
 * If invalid, returns the original input as string.
 *
 * Examples:
 * monthNameMX(1) -> "enero"
 * monthNameMX("12") -> "diciembre"
 */
export function monthNameMX(month: number | string): string {
  const n = Number(month);
  if (!Number.isInteger(n) || n < 1 || n > 12) return String(month);
  return MONTHS_ES_MX[n - 1];
}

/**
 * Optional: returns the month label with capitalization for UI.
 * Example: "Enero"
 */
export function monthLabelMX(month: number | string): string {
  const name = monthNameMX(month);
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : name;
}

