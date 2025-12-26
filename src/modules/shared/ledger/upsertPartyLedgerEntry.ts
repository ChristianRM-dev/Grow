// src/modules/shared/ledger/upsertPartyLedgerEntry.ts
import {
  Prisma,
  PartyLedgerSide,
  PartyLedgerSourceType,
} from "@/generated/prisma/client";

export type PartyLedgerUpsertInput = {
  partyId: string;
  side: PartyLedgerSide;
  sourceType: PartyLedgerSourceType;
  sourceId: string; // ✅ para unique derivado (no nullable aquí)
  reference: string;
  occurredAt: Date;
  amount: Prisma.Decimal; // ✅ signed
  notes?: string | null;
};

type Tx = Prisma.TransactionClient;

/**
 * Ensures ONE ledger entry per (sourceType, sourceId).
 * - If exists => update
 * - If not => create
 *
 * This is the core invariant for “derived ledger”.
 */
export async function upsertPartyLedgerEntry(
  tx: Tx,
  input: PartyLedgerUpsertInput
) {
  return tx.partyLedgerEntry.upsert({
    where: {
      sourceType_sourceId: {
        sourceType: input.sourceType,
        sourceId: input.sourceId,
      },
    },
    create: {
      partyId: input.partyId,
      side: input.side,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      reference: input.reference,
      occurredAt: input.occurredAt,
      amount: input.amount,
      notes: input.notes ?? null,
    },
    update: {
      // If source changes party/amount/date/reference, keep ledger in sync:
      partyId: input.partyId,
      side: input.side,
      reference: input.reference,
      occurredAt: input.occurredAt,
      amount: input.amount,
      notes: input.notes ?? null,
    },
    select: { id: true },
  });
}
