import {
  PaymentDirection,
  PartyLedgerSide,
  PartyLedgerSourceType,
  Prisma,
  PaymentType,
  AuditAction,
  AuditEntityType,
  AuditChangeKey,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import {
  createScopedLogger,
  type UseCaseContext,
} from "@/modules/shared/observability/scopedLogger";
import { toDecimal } from "@/modules/shared/utils/decimals";
import { safeTrim } from "@/modules/shared/utils/strings";
import { upsertPartyLedgerEntry } from "@/modules/shared/ledger/upsertPartyLedgerEntry";
import { computeSupplierPurchaseBalance } from "@/modules/supplier-purchases/application/computeSupplierPurchaseBalance";
import { createAuditLog } from "@/modules/shared/audit/createAuditLog.helper";
import { auditDecimalChange } from "@/modules/shared/audit/auditChanges";

export type UpdatePartyPaymentOutInput = {
  partyId: string;
  paymentType: PaymentType;
  supplierPurchaseId?: string; // ✅ optional FK
  amount: string;
  reference?: string;
  notes?: string;
  occurredAt?: Date;
};

export async function updatePartyPaymentOutUseCase(
  paymentId: string,
  input: UpdatePartyPaymentOutInput,
  ctx?: UseCaseContext
) {
  const logger = createScopedLogger("updatePartyPaymentOutUseCase", ctx);

  return prisma.$transaction(async (tx) => {
    const id = safeTrim(paymentId);
    if (!id) throw new Error("paymentId es requerido.");

    const existing = await tx.payment.findUnique({
      where: { id },
      select: {
        id: true,
        direction: true,
        partyId: true,
        salesNoteId: true,
        supplierPurchaseId: true, // ✅
      },
    });

    if (!existing) throw new Error("El pago no existe.");
    if (existing.direction !== PaymentDirection.OUT)
      throw new Error("Solo se permiten pagos de salida (OUT) aquí.");

    if (existing.salesNoteId)
      throw new Error(
        "Este pago pertenece a una nota de venta, usa el flujo correspondiente."
      );

    const partyId = safeTrim(input.partyId);
    if (!partyId) throw new Error("partyId es requerido.");

    const supplierPurchaseIdRaw = safeTrim(input.supplierPurchaseId);
    const supplierPurchaseId = supplierPurchaseIdRaw || null;

    // ✅ Optional: prevent moving payment between purchases once linked.
    if (
      supplierPurchaseId &&
      existing.supplierPurchaseId &&
      supplierPurchaseId !== existing.supplierPurchaseId
    ) {
      throw new Error("No se permite cambiar la compra asociada a este pago.");
    }

    // ✅ If setting (or keeping) a purchase link, validate ownership.
    const effectiveSupplierPurchaseId =
      existing.supplierPurchaseId ?? supplierPurchaseId;

    if (effectiveSupplierPurchaseId) {
      const purchase = await tx.supplierPurchase.findUnique({
        where: { id: effectiveSupplierPurchaseId },
        select: { id: true, partyId: true },
      });
      if (!purchase) throw new Error("La compra del proveedor no existe.");
      if (purchase.partyId !== partyId)
        throw new Error("La compra no pertenece al proveedor indicado.");
    }

    const occurredAt = input.occurredAt ?? new Date();
    const amount = toDecimal(input.amount);

    const updated = await tx.payment.update({
      where: { id },
      data: {
        partyId,
        supplierPurchaseId: existing.supplierPurchaseId ?? supplierPurchaseId, // ✅ allow set if was null
        paymentType: input.paymentType,
        amount,
        reference: safeTrim(input.reference) || null,
        notes: safeTrim(input.notes) || null,
        occurredAt,
      },
      select: {
        id: true,
        partyId: true,
        supplierPurchaseId: true,
        amount: true,
        reference: true,
        notes: true,
        occurredAt: true,
      },
    });

    const ledgerAmount = updated.amount!.mul(new Prisma.Decimal(-1));

    await upsertPartyLedgerEntry(tx, {
      partyId: updated.partyId!,
      side: PartyLedgerSide.PAYABLE,
      sourceType: PartyLedgerSourceType.PAYMENT,
      sourceId: updated.id,
      reference: updated.reference
        ? `Pago ${updated.reference}`
        : "Pago a proveedor",
      occurredAt: updated.occurredAt,
      amount: ledgerAmount,
      notes: updated.notes,
    });

    const balanceBefore = effectiveSupplierPurchaseId
      ? await computeSupplierPurchaseBalance(tx, effectiveSupplierPurchaseId)
      : null;

    // Keep current amount before update for audit
    const paymentBefore = await tx.payment.findUnique({
      where: { id },
      select: { amount: true },
    });
    const amountBefore = (paymentBefore?.amount ??
      new Prisma.Decimal(0)) as Prisma.Decimal;

    if (effectiveSupplierPurchaseId) {
      const balanceAfter = await computeSupplierPurchaseBalance(
        tx,
        effectiveSupplierPurchaseId
      );

      await createAuditLog(
        tx,
        {
          action: AuditAction.UPDATE,
          eventKey: "supplierPurchase.payment.updated",
          entityType: AuditEntityType.PAYMENT,
          entityId: updated.id,
          rootEntityType: AuditEntityType.SUPPLIER_PURCHASE,
          rootEntityId: effectiveSupplierPurchaseId,
          reference: safeTrim(updated.reference ?? "") || null,
          occurredAt: updated.occurredAt,
          changes: [
            auditDecimalChange(
              AuditChangeKey.PAYMENT_AMOUNT,
              amountBefore,
              updated.amount ?? null
            ),
            auditDecimalChange(
              AuditChangeKey.SUPPLIER_PURCHASE_BALANCE_DUE,
              balanceBefore?.balance ?? null,
              balanceAfter.balance
            ),
          ],
          meta: {
            partyId: updated.partyId,
          },
        },
        ctx
      );
    }

    logger.log("updated", {
      paymentId: updated.id,
      supplierPurchaseId: updated.supplierPurchaseId ?? null,
    });

    return { paymentId: updated.id };
  });
}
