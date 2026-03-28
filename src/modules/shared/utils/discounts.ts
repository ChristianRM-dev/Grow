export const LINE_DISCOUNT_OPTIONS = [0, 10] as const;

export type LineDiscountPercent = (typeof LINE_DISCOUNT_OPTIONS)[number];

export function normalizeDiscountPercent(
  value: number | string | null | undefined,
): LineDiscountPercent {
  return Number(value) === 10 ? 10 : 0;
}

export function hasDiscount(
  discountPercent: number | string | null | undefined,
): boolean {
  return normalizeDiscountPercent(discountPercent) > 0;
}

export function hasAnyDiscount(
  lines: ReadonlyArray<{ discountPercent?: number | string | null | undefined }>,
): boolean {
  return lines.some((line) => hasDiscount(line.discountPercent));
}

export function formatDiscountLabel(
  discountPercent: number | string | null | undefined,
): string {
  const normalized = normalizeDiscountPercent(discountPercent);
  return normalized > 0 ? `${normalized}%` : "";
}

export function roundMoneyNumber(value: number): number {
  if (!Number.isFinite(value)) return NaN;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeDiscountedLineTotalsNumber(params: {
  quantity: number;
  unitPrice: number;
  discountPercent?: number | string | null;
}) {
  const { quantity, unitPrice } = params;
  const discountPercent = normalizeDiscountPercent(params.discountPercent);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return {
      subtotal: NaN,
      discountAmount: NaN,
      lineTotal: NaN,
      discountPercent,
    };
  }

  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    return {
      subtotal: NaN,
      discountAmount: NaN,
      lineTotal: NaN,
      discountPercent,
    };
  }

  const subtotal = roundMoneyNumber(quantity * unitPrice);
  const discountAmount = roundMoneyNumber((subtotal * discountPercent) / 100);
  const lineTotal = roundMoneyNumber(subtotal - discountAmount);

  return {
    subtotal,
    discountAmount,
    lineTotal,
    discountPercent,
  };
}
