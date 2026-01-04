// src/modules/shared/utils/decimals.ts
import { Prisma } from "@/generated/prisma/client";

export function toDecimal(
  value: string | number | Prisma.Decimal
): Prisma.Decimal {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
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
