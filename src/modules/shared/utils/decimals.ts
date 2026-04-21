// src/modules/shared/utils/decimals.ts
import { Prisma } from "@/generated/prisma/client";
import { normalizeDiscountPercent } from "./discounts";

export function toDecimal(value: string | number): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

export function zeroDecimal(): Prisma.Decimal {
  return new Prisma.Decimal(0);
}

export function decimalOrZero(
  value: Prisma.Decimal | null | undefined,
): Prisma.Decimal {
  return value ?? zeroDecimal();
}

export function decimalToString(
  value: Prisma.Decimal | null | undefined,
): string {
  return decimalOrZero(value).toString();
}

export function clampDecimalToZero(value: Prisma.Decimal): Prisma.Decimal {
  return value.lt(0) ? zeroDecimal() : value;
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

type DecimalSumGroup<TKey extends string> = {
  _sum: { amount: Prisma.Decimal | null };
} & Record<TKey, string | null>;

export function mapDecimalSumsByKey<TKey extends string>(
  groups: readonly DecimalSumGroup<TKey>[],
  key: TKey,
): Map<string, Prisma.Decimal> {
  const result = new Map<string, Prisma.Decimal>();

  for (const group of groups) {
    const groupKey = group[key];
    if (!groupKey) continue;

    result.set(groupKey, decimalOrZero(group._sum.amount));
  }

  return result;
}

export function computeOutstandingBalance(params: {
  total: Prisma.Decimal | null | undefined;
  paid: Prisma.Decimal | null | undefined;
}) {
  const total = decimalOrZero(params.total);
  const paid = decimalOrZero(params.paid);
  const remaining = clampDecimalToZero(total.sub(paid));

  return {
    total,
    paid,
    remaining,
    isFullyPaid: remaining.lte(0),
  };
}
