import { Prisma, AuditChangeKey } from "@/generated/prisma/client";
import { toDecimal } from "@/modules/shared/utils/decimals";
import { safeTrim } from "@/modules/shared/utils/strings";

type DecimalLike = string | number | Prisma.Decimal;

export type AuditChangeInput = {
  key: AuditChangeKey;

  decimalBefore?: DecimalLike | null;
  decimalAfter?: DecimalLike | null;

  stringBefore?: string | null;
  stringAfter?: string | null;

  jsonBefore?: unknown | null;
  jsonAfter?: unknown | null;
};

export function auditDecimalChange(
  key: AuditChangeKey,
  before: DecimalLike | null | undefined,
  after: DecimalLike | null | undefined
): AuditChangeInput {
  return { key, decimalBefore: before ?? null, decimalAfter: after ?? null };
}

export function auditStringChange(
  key: AuditChangeKey,
  before: string | null | undefined,
  after: string | null | undefined
): AuditChangeInput {
  return { key, stringBefore: before ?? null, stringAfter: after ?? null };
}

export function auditJsonChange(
  key: AuditChangeKey,
  before: unknown | null | undefined,
  after: unknown | null | undefined
): AuditChangeInput {
  return { key, jsonBefore: before ?? null, jsonAfter: after ?? null };
}

function decimalLikeToDecimal(value: DecimalLike): Prisma.Decimal {
  // Prisma.Decimal has toString(). This keeps typing safe and avoids widening to any.
  if (typeof value === "string" || typeof value === "number") {
    return toDecimal(value);
  }
  // value is Prisma.Decimal
  return toDecimal(value.toString());
}

export function normalizeAuditChange(input: AuditChangeInput): {
  key: AuditChangeKey;
  decimalBefore: Prisma.Decimal | null;
  decimalAfter: Prisma.Decimal | null;
  stringBefore: string | null;
  stringAfter: string | null;
  jsonBefore?: Prisma.InputJsonValue;
  jsonAfter?: Prisma.InputJsonValue;
} {
  const decimalBefore =
    input.decimalBefore === undefined || input.decimalBefore === null
      ? null
      : decimalLikeToDecimal(input.decimalBefore);

  const decimalAfter =
    input.decimalAfter === undefined || input.decimalAfter === null
      ? null
      : decimalLikeToDecimal(input.decimalAfter);

  const stringBefore = safeTrim(input.stringBefore ?? "") || null;
  const stringAfter = safeTrim(input.stringAfter ?? "") || null;

  const jsonBefore =
    input.jsonBefore === undefined ? undefined : (input.jsonBefore as any);

  const jsonAfter =
    input.jsonAfter === undefined ? undefined : (input.jsonAfter as any);

  return {
    key: input.key,
    decimalBefore,
    decimalAfter,
    stringBefore,
    stringAfter,
    jsonBefore,
    jsonAfter,
  };
}
