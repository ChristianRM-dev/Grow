import { Prisma, AuditEntityType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type AuditLogChangeDto = {
  key: string;

  decimalBefore: string | null;
  decimalAfter: string | null;

  stringBefore: string | null;
  stringAfter: string | null;

  jsonBefore: unknown | null;
  jsonAfter: unknown | null;
};

export type SalesNoteAuditLogRowDto = {
  id: string;
  eventKey: string;
  action: string;

  entityType: string;
  entityId: string;

  reference: string | null;
  occurredAt: string | null; // ISO
  createdAt: string; // ISO

  actorNameSnapshot: string | null;
  actorRoleSnapshot: string | null;

  changes: AuditLogChangeDto[];
};

function decToString(v: Prisma.Decimal | null | undefined): string | null {
  if (v == null) return null;
  return v.toString();
}

function isPrismaKnownError(
  err: unknown
): err is Prisma.PrismaClientKnownRequestError {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as any).code &&
    typeof (err as any).code === "string"
  );
}

/**
 * Returns audit log rows for a SalesNote root, including payments.
 * This is used for the "Historial de movimientos" collapsible section.
 */
export async function getSalesNoteAuditLogById(
  salesNoteId: string
): Promise<SalesNoteAuditLogRowDto[]> {
  const id = String(salesNoteId ?? "").trim();
  if (!id) return [];

  // Small trace id to correlate logs in Vercel
  const trace = `audit_sn_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  // Minimal debug context (no sensitive data)
  console.log(
    `[getSalesNoteAuditLogById] start trace=${trace} salesNoteId=${id}`
  );

  try {
    const rows = await prisma.auditLog.findMany({
      where: {
        rootEntityType: AuditEntityType.SALES_NOTE,
        rootEntityId: id,
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        eventKey: true,
        action: true,
        entityType: true,
        entityId: true,
        reference: true,
        occurredAt: true,
        createdAt: true,
        actorNameSnapshot: true,
        actorRoleSnapshot: true,
        changes: {
          orderBy: [{ id: "asc" }],
          select: {
            key: true,
            decimalBefore: true,
            decimalAfter: true,
            stringBefore: true,
            stringAfter: true,
            jsonBefore: true,
            jsonAfter: true,
          },
        },
      },
    });

    console.log(
      `[getSalesNoteAuditLogById] ok trace=${trace} rows=${rows.length}`
    );

    return rows.map((r) => ({
      id: r.id,
      eventKey: r.eventKey,
      action: String(r.action),
      entityType: String(r.entityType),
      entityId: r.entityId,
      reference: r.reference ?? null,
      occurredAt: r.occurredAt ? r.occurredAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      actorNameSnapshot: r.actorNameSnapshot ?? null,
      actorRoleSnapshot: r.actorRoleSnapshot
        ? String(r.actorRoleSnapshot)
        : null,
      changes: r.changes.map((c) => ({
        key: String(c.key),
        decimalBefore: decToString(c.decimalBefore),
        decimalAfter: decToString(c.decimalAfter),
        stringBefore: c.stringBefore ?? null,
        stringAfter: c.stringAfter ?? null,
        jsonBefore: (c.jsonBefore as unknown) ?? null,
        jsonAfter: (c.jsonAfter as unknown) ?? null,
      })),
    }));
  } catch (err: unknown) {
    // This is the key part: Prisma P2022 includes meta.modelName / meta.column
    if (isPrismaKnownError(err)) {
      console.error(
        `[getSalesNoteAuditLogById] prisma_error trace=${trace} code=${err.code}`,
        {
          meta: (err as any).meta,
          message: (err as any).message,
        }
      );
    } else if (err instanceof Error) {
      console.error(
        `[getSalesNoteAuditLogById] error trace=${trace} message=${err.message}`,
        { stack: err.stack }
      );
    } else {
      console.error(
        `[getSalesNoteAuditLogById] unknown_error trace=${trace}`,
        err
      );
    }

    // Fail soft for UI: return empty list so details page still loads
    return [];
  }
}
