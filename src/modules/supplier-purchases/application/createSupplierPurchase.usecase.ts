import {
  Prisma,
  PartyLedgerSide,
  PartyLedgerSourceType,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import {
  createScopedLogger,
  type UseCaseContext,
} from "@/modules/shared/observability/scopedLogger";
import { toDecimal } from "@/modules/shared/utils/decimals";
import { safeTrim } from "@/modules/shared/utils/strings";
import { upsertPartyLedgerEntry } from "@/modules/shared/ledger/upsertPartyLedgerEntry";

export type CreateSupplierPurchaseInput = {
  partyId: string;
  supplierFolio: string;
  total: string; // decimal string
  notes?: string;
  occurredAt?: Date; // optional, defaults now
};

export async function createSupplierPurchaseUseCase(
  input: CreateSupplierPurchaseInput,
  ctx?: UseCaseContext
) {
  const logger = createScopedLogger("createSupplierPurchaseUseCase", ctx);

  return prisma.$transaction(async (tx) => {
    const partyId = safeTrim(input.partyId);
    if (!partyId) throw new Error("partyId es requerido.");

    const supplierFolio = safeTrim(input.supplierFolio);
    if (!supplierFolio) throw new Error("supplierFolio es requerido.");

    const occurredAt = input.occurredAt ?? new Date();
    const total = toDecimal(input.total);

    // Validate party exists and not deleted
    const party = await tx.party.findFirst({
      where: { id: partyId, isDeleted: false },
      select: { id: true, name: true },
    });
    if (!party) throw new Error("El proveedor no existe o está eliminado.");

    const created = await tx.supplierPurchase.create({
      data: {
        partyId,
        supplierFolio,
        occurredAt,
        total,
        notes: safeTrim(input.notes) || null,
      },
      select: {
        id: true,
        partyId: true,
        supplierFolio: true,
        occurredAt: true,
        total: true,
        notes: true,
      },
    });

    // Ledger: proveedor => PAYABLE (le debemos) +total
    await upsertPartyLedgerEntry(tx, {
      partyId: created.partyId,
      side: PartyLedgerSide.PAYABLE,
      sourceType: PartyLedgerSourceType.SUPPLIER_PURCHASE,
      sourceId: created.id,
      reference: `Compra ${created.supplierFolio}`,
      occurredAt: created.occurredAt,
      amount: created.total, // ✅ positive debt
      notes: created.notes,
    });

    logger.log("created", { supplierPurchaseId: created.id });
    return { supplierPurchaseId: created.id };
  });
}
