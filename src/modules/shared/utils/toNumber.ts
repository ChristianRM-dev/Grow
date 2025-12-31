// src/modules/shared/utils/toNumber.ts
export function toNumber(value: unknown): number {
  if (value == null) return 0;

  // Prisma Decimal (decimal.js) usually exposes toNumber()
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    const maybe = value as { toNumber?: () => number };
    if (typeof maybe.toNumber === "function") return maybe.toNumber();
  }

  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
