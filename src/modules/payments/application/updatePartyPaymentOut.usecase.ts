import {
  AuditAction,
  AuditChangeKey,
  AuditEntityType,
  PaymentDirection,
  PartyLedgerSide,
  PartyLedgerSourceType,
  Prisma,
  PaymentType,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import {
  createScopedLogger,
  type UseCaseContext,
} from "@/modules/shared/observability/scopedLogger";
import { toDecimal } from "@/modules/shared/utils/decimals";
import { safeTrim } from "@/modules/shared/utils/strings";
import { upsertPartyLedgerEntry } from "@/modules/shared/ledger/upsertPartyLedgerEntry";
import {
  auditDecimalChange,
  createAuditLog,
} from "@/modules/shared/audit/createAuditLog.helper";

export type UpdatePartyPaymentOutInput = {
  partyId: string;
  paymentType: PaymentType; // <- reemplaza por PaymentType
  amount: string;
  reference?: string;
  notes?: string;
  occurredAt?: Date;
  supplierPurchaseId?: string | null;
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
        supplierPurchaseId: true,
        amount: true,
        occurredAt: true,
      },
    });

    if (!existing) throw new Error("El pago no existe.");
    if (existing.direction !== PaymentDirection.OUT)
      throw new Error("Solo se permiten pagos de salida (OUT) aquí.");

    // opcional: restringe a pagos “de proveedor” (no ligados a salesNote)
    if (existing.salesNoteId)
      throw new Error(
        "Este pago pertenece a una nota de venta, usa el flujo correspondiente."
      );

    const partyId = safeTrim(input.partyId);
    if (partyId && partyId !== existing.partyId) {
      throw new Error("El pago pertenece a otro proveedor.");
    }

    const occurredAt = input.occurredAt ?? new Date();
    const amount = toDecimal(input.amount);
    const clampToZero = (value: Prisma.Decimal) =>
      value.lt(0) ? new Prisma.Decimal(0) : value;

    const supplierPurchaseId =
      safeTrim(input.supplierPurchaseId) || existing.supplierPurchaseId;

    let supplierPurchase:
      | { id: string; partyId: string; total: Prisma.Decimal }
      | null = null;

    if (supplierPurchaseId) {
      const found = await tx.supplierPurchase.findUnique({
        where: { id: supplierPurchaseId },
        select: { id: true, partyId: true, total: true },
      });

      if (!found) throw new Error("La compra del proveedor no existe.");
      if (found.partyId !== existing.partyId)
        throw new Error("La compra pertenece a otro proveedor.");

      supplierPurchase = found;
    }

    const paidAgg =
      supplierPurchase == null
        ? null
        : await tx.payment.aggregate({
            where: {
              direction: PaymentDirection.OUT,
              supplierPurchaseId: supplierPurchase.id,
              NOT: { id },
            },
            _sum: { amount: true },
          });

    const paidOther =
      paidAgg?._sum.amount != null
        ? (paidAgg._sum.amount as Prisma.Decimal)
        : new Prisma.Decimal(0);

    const paidBefore = paidOther.add(existing.amount ?? new Prisma.Decimal(0));
    const balanceBefore =
      supplierPurchase == null
        ? null
        : clampToZero(supplierPurchase.total.sub(paidBefore));

    const updated = await tx.payment.update({
      where: { id },
      data: {
        supplierPurchaseId,
        paymentType: input.paymentType,
        amount,
        reference: safeTrim(input.reference) || null,
        notes: safeTrim(input.notes) || null,
        occurredAt,
      },
      select: {
        id: true,
        partyId: true,
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

    const actor =
      ctx?.user && ctx.user.id
        ? {
            userId: ctx.user.id,
            name: ctx.user.name,
            email: ctx.user.email,
          }
        : undefined;

    if (supplierPurchase) {
      const paidAfter = paidOther.add(updated.amount ?? new Prisma.Decimal(0));
      const balanceAfter = clampToZero(
        supplierPurchase.total.sub(paidAfter)
      );

      await createAuditLog(tx, {
        eventKey: "supplierPurchase.payment.updated",
        action: AuditAction.UPDATE,
        entity: { type: AuditEntityType.PAYMENT, id: updated.id },
        rootEntity: {
          type: AuditEntityType.SUPPLIER_PURCHASE,
          id: supplierPurchase.id,
        },
        reference: updated.reference,
        occurredAt: updated.occurredAt,
        traceId: ctx?.traceId,
        actor,
        changes: [
          auditDecimalChange(
            AuditChangeKey.PAYMENT_AMOUNT,
            existing.amount,
            updated.amount
          ),
          auditDecimalChange(
            AuditChangeKey.SUPPLIER_PURCHASE_BALANCE_DUE,
            balanceBefore,
            balanceAfter
          ),
        ],
      });
    }

    logger.log("updated", { paymentId: updated.id });
    return { paymentId: updated.id };
  });
}
