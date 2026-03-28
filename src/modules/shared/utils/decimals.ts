// src/modules/shared/utils/decimals.ts
import { Prisma } from "@/generated/prisma/client";
import { normalizeDiscountPercent } from "./discounts";

export function toDecimal(value: string | number): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

export function zeroDecimal(): Prisma.Decimal {
  return new Prisma.Decimal(0);
}

export function sumDecimals<T>(
  items: readonly T[],
  selector: (item: T) => Prisma.Decimal
): Prisma.Decimal {
  return items.reduce((acc, item) => acc.add(selector(item)), zeroDecimal());
}

export function roundMoneyDecimal(value: Prisma.Decimal): Prisma.Decimal {
  return value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

export function computeDiscountedLineTotalsDecimal(params: {
  quantity: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
  discountPercent?: number | string | null;
}) {
  const { quantity, unitPrice } = params;
  const discountPercent = normalizeDiscountPercent(params.discountPercent);
  const subtotal = roundMoneyDecimal(quantity.mul(unitPrice));
  const discountAmount = roundMoneyDecimal(
    subtotal.mul(discountPercent).div(100),
  );
  const lineTotal = roundMoneyDecimal(subtotal.sub(discountAmount));

  return {
    subtotal,
    discountAmount,
    lineTotal,
    discountPercent,
  };
}
