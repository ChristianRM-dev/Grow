import { z } from "zod";

import {
  AuditAction,
  AuditChangeKey,
  AuditEntityType,
  Prisma,
} from "@/generated/prisma/client";
import { toDecimal } from "@/modules/shared/utils/decimals";
import { safeTrim } from "@/modules/shared/utils/strings";

type Decimalish = Prisma.Decimal | string | number | null | undefined;

export type AuditChangeInput = {
  key: AuditChangeKey;
  decimalBefore?: Decimalish;
  decimalAfter?: Decimalish;
  stringBefore?: string | null;
  stringAfter?: string | null;
  jsonBefore?: unknown;
  jsonAfter?: unknown;
};

export type AuditActorSnapshot = {
  userId?: string | null;
  name?: string | null;
  email?: string | null;
};

export type CreateAuditLogParams = {
  eventKey: string;
  action: AuditAction;
  entity: { type: AuditEntityType; id: string };
  rootEntity?: { type: AuditEntityType; id: string };
  reference?: string | null;
  occurredAt: Date;
  meta?: Record<string, unknown> | null;
  traceId?: string;
  actor?: AuditActorSnapshot | null;
  changes: AuditChangeInput[];
};

const decimalSchema = z
  .preprocess((value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    return toDecimal(value as string | number | Prisma.Decimal);
  }, z.instanceof(Prisma.Decimal).nullable().optional());

const stringSchema = z
  .preprocess((value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = safeTrim(value);
    return trimmed || null;
  }, z.string().nullable().optional());

const changeSchema = z
  .object({
    key: z.nativeEnum(AuditChangeKey),
    decimalBefore: decimalSchema,
    decimalAfter: decimalSchema,
    stringBefore: stringSchema,
    stringAfter: stringSchema,
    jsonBefore: z.unknown().optional(),
    jsonAfter: z.unknown().optional(),
  })
  .refine(
    (change) =>
      change.decimalBefore !== undefined ||
      change.decimalAfter !== undefined ||
      change.stringBefore !== undefined ||
      change.stringAfter !== undefined ||
      change.jsonBefore !== undefined ||
      change.jsonAfter !== undefined,
    { message: "At least one before/after value is required per change" }
  );

const actorSchema = z
  .object({
    userId: stringSchema,
    name: stringSchema,
    email: stringSchema,
  })
  .optional()
  .nullable();

const auditSchema = z.object({
  eventKey: z.string().trim().min(1),
  action: z.nativeEnum(AuditAction),
  entity: z.object({
    type: z.nativeEnum(AuditEntityType),
    id: z.string().trim().min(1),
  }),
  rootEntity: z
    .object({
      type: z.nativeEnum(AuditEntityType),
      id: z.string().trim().min(1),
    })
    .optional(),
  reference: stringSchema,
  occurredAt: z.date(),
  meta: z.record(z.unknown()).optional().nullable(),
  traceId: stringSchema,
  actor: actorSchema,
  changes: z.array(changeSchema).min(1),
});

export async function createAuditLog(
  tx: Prisma.TransactionClient,
  params: CreateAuditLogParams
) {
  const parsed = auditSchema.parse(params);

  const rootEntityType = parsed.rootEntity?.type ?? parsed.entity.type;
  const rootEntityId = parsed.rootEntity?.id ?? parsed.entity.id;

  const meta: Record<string, unknown> | null =
    parsed.meta || parsed.traceId
      ? {
          ...(parsed.meta ?? {}),
          ...(parsed.traceId ? { traceId: parsed.traceId } : {}),
        }
      : null;

  const auditLog = await tx.auditLog.create({
    data: {
      eventKey: parsed.eventKey,
      action: parsed.action,
      entityType: parsed.entity.type,
      entityId: parsed.entity.id,
      rootEntityType,
      rootEntityId,
      reference: parsed.reference ?? null,
      actorUserId: parsed.actor?.userId ?? null,
      actorUserName: parsed.actor?.name ?? null,
      actorUserEmail: parsed.actor?.email ?? null,
      occurredAt: parsed.occurredAt,
      meta,
      changes: {
        create: parsed.changes.map((change) => ({
          key: change.key,
          decimalBefore: change.decimalBefore ?? null,
          decimalAfter: change.decimalAfter ?? null,
          stringBefore: change.stringBefore ?? null,
          stringAfter: change.stringAfter ?? null,
          jsonBefore:
            change.jsonBefore === undefined ? null : change.jsonBefore,
          jsonAfter: change.jsonAfter === undefined ? null : change.jsonAfter,
        })),
      },
    },
    select: { id: true },
  });

  return auditLog;
}

export function auditDecimalChange(
  key: AuditChangeKey,
  before: Decimalish,
  after: Decimalish
): AuditChangeInput {
  return {
    key,
    decimalBefore: before === undefined ? null : before,
    decimalAfter: after === undefined ? null : after,
  };
}

export function auditStringChange(
  key: AuditChangeKey,
  before: string | null | undefined,
  after: string | null | undefined
): AuditChangeInput {
  return {
    key,
    stringBefore: before ?? null,
    stringAfter: after ?? null,
  };
}
