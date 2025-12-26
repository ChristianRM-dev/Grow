// src/modules/parties/application/resolvePartyIdForCustomerSelection.ts
import { Prisma } from "@/generated/prisma/client";
import { safeTrim } from "@/modules/shared/utils/strings";
import {
  WALK_IN_PUBLIC_NAME,
  WALK_IN_PUBLIC_SYSTEM_KEY,
} from "@/modules/parties/domain/systemParties";

type Tx = Prisma.TransactionClient;
type LoggerLike =
  | { log: (message: string, extra?: unknown) => void }
  | undefined;

export type CustomerSelectionInput = {
  mode: "PUBLIC" | "PARTY";
  partyMode?: "EXISTING" | "NEW";
  existingPartyId?: string;
  newParty?: { name?: string; phone?: string; notes?: string };
};

async function getOrCreateWalkInPublicPartyId(
  tx: Tx,
  logger?: LoggerLike
): Promise<string> {
  const row = await tx.party.upsert({
    where: { systemKey: WALK_IN_PUBLIC_SYSTEM_KEY },
    update: {},
    create: { systemKey: WALK_IN_PUBLIC_SYSTEM_KEY, name: WALK_IN_PUBLIC_NAME },
    select: { id: true },
  });

  logger?.log("walk_in_party_resolved", { id: row.id });
  return row.id;
}

export async function resolvePartyIdForCustomerSelection(
  tx: Tx,
  input: CustomerSelectionInput,
  logger?: LoggerLike
): Promise<string> {
  if (input.mode === "PUBLIC") {
    return getOrCreateWalkInPublicPartyId(tx, logger);
  }

  // mode === PARTY
  if (input.partyMode === "EXISTING") {
    const id = safeTrim(input.existingPartyId);
    if (!id) throw new Error("Missing existingPartyId for PARTY/EXISTING.");

    const party = await tx.party.findFirst({
      where: { id, isDeleted: false },
      select: { id: true },
    });

    if (!party)
      throw new Error("Selected customer does not exist or is deleted.");

    logger?.log("party_existing_resolved", { id: party.id });
    return party.id;
  }

  // partyMode === NEW
  const name = safeTrim(input.newParty?.name);
  if (!name) throw new Error("Missing newParty.name for PARTY/NEW.");

  const created = await tx.party.create({
    data: {
      name,
      phone: safeTrim(input.newParty?.phone) || null,
      notes: safeTrim(input.newParty?.notes) || null,
    },
    select: { id: true },
  });

  logger?.log("party_created", { id: created.id });
  return created.id;
}
