/**
 * Shared money/price utility functions.
 *
 * Used across Sales Notes, Quotations, and other document forms
 * for consistent price parsing and validation.
 */

/**
 * Normalize a raw money input string by removing currency symbols,
 * whitespace, and replacing commas with dots.
 */
export function normalizeMoneyInput(v: string): string {
  return String(v ?? "")
    .trim()
    .replace(/\$/g, "")
    .replace(/\s+/g, "")
    .replace(/,/g, ".");
}

/**
 * Parse a string to a finite number, returning NaN if invalid.
 */
export function parseMoney(v: string): number {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Parse a money string after normalizing it (removes $, commas, etc.).
 */
export function parseMoneyNormalized(v: string): number {
  const n = Number(normalizeMoneyInput(v));
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Check if a string looks like a valid positive price (e.g., "12" or "12.50").
 */
export function isPriceLike(v: string): boolean {
  const s = String(v ?? "").trim();
  return /^\d+(\.\d{1,2})?$/.test(s) && Number(s) > 0;
}

/**
 * Alias for parseMoney - converts a string to a finite number or NaN.
 */
export function toNumber(v: string): number {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Compute the row total for a line item given quantity and price string.
 * Returns NaN if either value is invalid or non-positive.
 */
export function computeRowTotal(quantity: number, priceStr: string): number {
  const qty = Number(quantity ?? 0);
  const price = parseMoney(priceStr);
  if (!Number.isFinite(qty) || qty <= 0) return NaN;
  if (!Number.isFinite(price) || price <= 0) return NaN;
  return qty * price;
}

/**
 * Compute subtotal for an array of line items.
 * Each item must provide quantity and a price string.
 */
export function computeSubtotal(
  lines: Array<{ quantity?: number; price?: string }>,
): number {
  let subtotal = 0;
  for (const r of lines) {
    const qty = Number(r.quantity ?? 0);
    const price = parseMoney(r.price ?? "");
    if (!Number.isFinite(qty) || qty <= 0) continue;
    if (!Number.isFinite(price) || price <= 0) continue;
    subtotal += qty * price;
  }
  return subtotal;
}
