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

/**
 * Returns audit log rows for a SalesNote root, including payments.
 * This is used for the "Historial de movimientos" collapsible section.
 */
export async function getSalesNoteAuditLogById(
  salesNoteId: string
): Promise<SalesNoteAuditLogRowDto[]> {
  const id = String(salesNoteId ?? "").trim();
  if (!id) return [];

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
    actorRoleSnapshot: r.actorRoleSnapshot ? String(r.actorRoleSnapshot) : null,
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
}
