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

export type CreatePartyPaymentOutInput = {
  partyId: string;
  paymentType: PaymentType;
  supplierPurchaseId?: string; // ✅ optional FK
  amount: string;
  reference?: string;
  notes?: string;
  occurredAt?: Date;
};

export async function createPartyPaymentOutUseCase(
  input: CreatePartyPaymentOutInput,
  ctx?: UseCaseContext
) {
  const logger = createScopedLogger("createPartyPaymentOutUseCase", ctx);

  return prisma.$transaction(async (tx) => {
    const partyId = safeTrim(input.partyId);
    if (!partyId) throw new Error("partyId es requerido.");

    const supplierPurchaseIdRaw = safeTrim(input.supplierPurchaseId);
    const supplierPurchaseId = supplierPurchaseIdRaw || null;

    const party = await tx.party.findFirst({
      where: { id: partyId, isDeleted: false },
      select: { id: true, name: true },
    });
    if (!party) throw new Error("El proveedor no existe o está eliminado.");

    // ✅ If linked to a purchase, validate it belongs to this supplier.
    if (supplierPurchaseId) {
      const purchase = await tx.supplierPurchase.findUnique({
        where: { id: supplierPurchaseId },
        select: { id: true, partyId: true },
      });
      if (!purchase) throw new Error("La compra del proveedor no existe.");
      if (purchase.partyId !== partyId)
        throw new Error("La compra no pertenece al proveedor indicado.");
    }

    const occurredAt = input.occurredAt ?? new Date();
    const amount = toDecimal(input.amount);

    const payment = await tx.payment.create({
      data: {
        salesNoteId: null,
        partyId,
        supplierPurchaseId, // ✅ FK stored
        direction: PaymentDirection.OUT,
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

    if (payment.amount == null)
      throw new Error("El monto del pago es requerido.");
    if (payment.amount.lte(new Prisma.Decimal(0)))
      throw new Error("El monto del pago debe ser mayor a 0.");

    const ledgerAmount = payment.amount.mul(new Prisma.Decimal(-1));

    await upsertPartyLedgerEntry(tx, {
      partyId: payment.partyId!,
      side: PartyLedgerSide.PAYABLE,
      sourceType: PartyLedgerSourceType.PAYMENT,
      sourceId: payment.id,
      reference: payment.reference
        ? `Pago ${payment.reference}`
        : "Pago a proveedor",
      occurredAt: payment.occurredAt,
      amount: ledgerAmount,
      notes: payment.notes,
    });

    const balanceBefore = supplierPurchaseId
      ? await computeSupplierPurchaseBalance(tx, supplierPurchaseId)
      : null;

    if (supplierPurchaseId) {
      const balanceAfter = await computeSupplierPurchaseBalance(
        tx,
        supplierPurchaseId
      );

      await createAuditLog(
        tx,
        {
          action: AuditAction.CREATE,
          eventKey: "supplierPurchase.payment.created",
          entityType: AuditEntityType.PAYMENT,
          entityId: payment.id,
          rootEntityType: AuditEntityType.SUPPLIER_PURCHASE,
          rootEntityId: supplierPurchaseId,
          reference: safeTrim(payment.reference ?? "") || null,
          occurredAt: payment.occurredAt,
          changes: [
            auditDecimalChange(
              AuditChangeKey.PAYMENT_AMOUNT,
              null,
              payment.amount ?? null
            ),
            auditDecimalChange(
              AuditChangeKey.SUPPLIER_PURCHASE_BALANCE_DUE,
              balanceBefore?.balance ?? null,
              balanceAfter.balance
            ),
          ],
          meta: {
            partyId: payment.partyId,
          },
        },
        ctx
      );
    }

    logger.log("created", {
      paymentId: payment.id,
      supplierPurchaseId: payment.supplierPurchaseId ?? null,
    });

    return { paymentId: payment.id };
  });
}
