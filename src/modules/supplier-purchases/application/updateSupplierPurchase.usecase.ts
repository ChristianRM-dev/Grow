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

export type UpdateSupplierPurchaseInput = {
  partyId: string;
  supplierFolio: string;
  total: string;
  notes?: string;
  occurredAt?: Date;
};

export async function updateSupplierPurchaseUseCase(
  supplierPurchaseId: string,
  input: UpdateSupplierPurchaseInput,
  ctx?: UseCaseContext
) {
  const logger = createScopedLogger("updateSupplierPurchaseUseCase", ctx);

  return prisma.$transaction(async (tx) => {
    const id = safeTrim(supplierPurchaseId);
    if (!id) throw new Error("supplierPurchaseId es requerido.");

    const existing = await tx.supplierPurchase.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new Error("La compra no existe.");

    const partyId = safeTrim(input.partyId);
    const supplierFolio = safeTrim(input.supplierFolio);
    if (!partyId) throw new Error("partyId es requerido.");
    if (!supplierFolio) throw new Error("supplierFolio es requerido.");

    const occurredAt = input.occurredAt ?? new Date();
    const total = toDecimal(input.total);

    const party = await tx.party.findFirst({
      where: { id: partyId, isDeleted: false },
      select: { id: true },
    });
    if (!party) throw new Error("El proveedor no existe o está eliminado.");

    const updated = await tx.supplierPurchase.update({
      where: { id },
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

    // Ledger stays in sync (same sourceId)
    await upsertPartyLedgerEntry(tx, {
      partyId: updated.partyId,
      side: PartyLedgerSide.PAYABLE,
      sourceType: PartyLedgerSourceType.SUPPLIER_PURCHASE,
      sourceId: updated.id,
      reference: `Compra ${updated.supplierFolio}`,
      occurredAt: updated.occurredAt,
      amount: updated.total, // ✅ positive debt
      notes: updated.notes,
    });

    logger.log("updated", { supplierPurchaseId: updated.id });
    return { supplierPurchaseId: updated.id };
  });
}
