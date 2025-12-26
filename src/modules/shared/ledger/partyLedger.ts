// src/modules/shared/ledger/partyLedger.ts
import type { PrismaClient } from "@/generated/prisma/client";
import {
  PartyLedgerSourceType,
  PartyLedgerSide,
  Prisma,
} from "@/generated/prisma/client";

export type LedgerEntryInput = {
  partyId: string;
  side: PartyLedgerSide;
  sourceType: PartyLedgerSourceType;
  sourceId: string | null;
  reference: string;
  occurredAt: Date;
  amount: Prisma.Decimal;
  notes?: string | null;
};

/**
 * Ensures there is exactly ONE ledger entry for (sourceType, sourceId, side).
 * Since we don't have a DB unique constraint yet, we:
 * - findMany
 * - keep the oldest
 * - delete duplicates
 * - update/create the "kept" entry
 *
 * IMPORTANT:
 * - amount is signed (+ charge, - payment/credit)
 */
export async function ensureSingleLedgerEntryForSource(
  tx: PrismaClient,
  input: LedgerEntryInput
): Promise<{ id: string; created: boolean }> {
  const existing = await tx.partyLedgerEntry.findMany({
    where: {
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      side: input.side,
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (existing.length === 0) {
    const created = await tx.partyLedgerEntry.create({
      data: {
        partyId: input.partyId,
        side: input.side,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        reference: input.reference,
        occurredAt: input.occurredAt,
        amount: input.amount,
        notes: input.notes ?? null,
      },
      select: { id: true },
    });

    return { id: created.id, created: true };
  }

  const keepId = existing[0].id;

  // Clean duplicates (rare, but possible without unique constraints)
  if (existing.length > 1) {
    const dupIds = existing.slice(1).map((x) => x.id);
    await tx.partyLedgerEntry.deleteMany({ where: { id: { in: dupIds } } });
  }

  const updated = await tx.partyLedgerEntry.update({
    where: { id: keepId },
    data: {
      partyId: input.partyId,
      reference: input.reference,
      occurredAt: input.occurredAt,
      amount: input.amount,
      notes: input.notes ?? null,
    },
    select: { id: true },
  });

  return { id: updated.id, created: false };
}

/**
 * Bulk move ledger entries for payments (or other sources) to a new party.
 * Useful if a SalesNote changes customer and you want Party statements consistent.
 */
export async function reassignLedgerPartyBySourceIds(
  tx: PrismaClient,
  params: {
    sourceType: PartyLedgerSourceType;
    sourceIds: string[];
    newPartyId: string;
  }
) {
  const { sourceType, sourceIds, newPartyId } = params;
  if (sourceIds.length === 0) return;

  await tx.partyLedgerEntry.updateMany({
    where: {
      sourceType,
      sourceId: { in: sourceIds },
    },
    data: { partyId: newPartyId },
  });
}
