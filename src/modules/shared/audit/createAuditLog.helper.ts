import {
  AuditAction,
  AuditEntityType,
  Prisma,
  UserRole,
} from "@/generated/prisma/client";
import { safeTrim } from "@/modules/shared/utils/strings";
import type { UseCaseContext } from "@/modules/shared/observability/scopedLogger";
import { normalizeAuditChange, type AuditChangeInput } from "./auditChanges";

export type CreateAuditLogParams = {
  action: AuditAction;
  eventKey: string;

  entityType: AuditEntityType;
  entityId: string;

  rootEntityType: AuditEntityType;
  rootEntityId: string;

  reference?: string | null;
  occurredAt?: Date | null;

  meta?: Prisma.InputJsonValue | null;

  changes?: AuditChangeInput[];
};

function normalizeMeta(ctx?: UseCaseContext, meta?: Prisma.InputJsonValue) {
  const traceId = safeTrim((ctx as any)?.traceId ?? "");

  const hasMetaObject = meta != null && typeof meta === "object";
  const hasTrace = Boolean(traceId);

  if (!hasMetaObject && !hasTrace) return undefined;

  const base: Record<string, unknown> = hasMetaObject ? (meta as any) : {};
  if (hasTrace) base.traceId = traceId;

  return base as Prisma.InputJsonValue;
}

/**
 * Creates one append-only audit log event with typed before/after changes.
 * Must be called inside the same transaction as the business write.
 */
export async function createAuditLog(
  tx: Prisma.TransactionClient,
  params: CreateAuditLogParams,
  ctx?: UseCaseContext
) {
  const eventKey = safeTrim(params.eventKey);
  if (!eventKey) throw new Error("eventKey es requerido.");

  const entityId = safeTrim(params.entityId);
  const rootEntityId = safeTrim(params.rootEntityId);

  if (!entityId) throw new Error("entityId es requerido.");
  if (!rootEntityId) throw new Error("rootEntityId es requerido.");

  const actorUserId = safeTrim((ctx as any)?.user?.id ?? "") || null;
  const actorNameSnapshot = safeTrim((ctx as any)?.user?.name ?? "") || null;
  const actorRoleSnapshot =
    ((ctx as any)?.user?.role as UserRole | null | undefined) ?? null;

  const normalizedChanges = (params.changes ?? []).map(normalizeAuditChange);

  const created = await tx.auditLog.create({
    data: {
      actorUserId,
      actorNameSnapshot,
      actorRoleSnapshot,

      action: params.action,
      eventKey,

      entityType: params.entityType,
      entityId,

      rootEntityType: params.rootEntityType,
      rootEntityId,

      reference: safeTrim(params.reference ?? "") || null,
      occurredAt: params.occurredAt ?? null,

      meta: normalizeMeta(ctx, params.meta ?? undefined),

      changes: normalizedChanges.length
        ? {
            create: normalizedChanges.map((c) => ({
              key: c.key,
              decimalBefore: c.decimalBefore,
              decimalAfter: c.decimalAfter,
              stringBefore: c.stringBefore,
              stringAfter: c.stringAfter,
              jsonBefore: c.jsonBefore,
              jsonAfter: c.jsonAfter,
            })),
          }
        : undefined,
    },
    select: { id: true, createdAt: true },
  });

  return created;
}
