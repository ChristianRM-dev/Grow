import {
  PaymentDirection,
  PartyLedgerSide,
  PartyLedgerSourceType,
  Prisma,
  PaymentType,
  AuditAction,
  AuditChangeKey,
  AuditEntityType,
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

export type CreatePartyPaymentOutInput = {
  partyId: string;
  paymentType: PaymentType; // <- pon tu PaymentType importado donde corresponda
  amount: string; // decimal string
  reference?: string; // folio/ref
  notes?: string;
  occurredAt?: Date;
  supplierPurchaseId?: string | null;
};

export async function createPartyPaymentOutUseCase(
  input: CreatePartyPaymentOutInput,
  ctx?: UseCaseContext
) {
  const logger = createScopedLogger("createPartyPaymentOutUseCase", ctx);

  return prisma.$transaction(async (tx) => {
    const partyId = safeTrim(input.partyId);
    if (!partyId) throw new Error("partyId es requerido.");

    const supplierPurchaseId = safeTrim(input.supplierPurchaseId) || null;

    const party = await tx.party.findFirst({
      where: { id: partyId, isDeleted: false },
      select: { id: true, name: true },
    });
    if (!party) throw new Error("El proveedor no existe o está eliminado.");

    let supplierPurchase:
      | { id: string; partyId: string; total: Prisma.Decimal }
      | null = null;

    if (supplierPurchaseId) {
      const found = await tx.supplierPurchase.findUnique({
        where: { id: supplierPurchaseId },
        select: { id: true, partyId: true, total: true },
      });

      if (!found) throw new Error("La compra del proveedor no existe.");
      if (found.partyId !== partyId)
        throw new Error("La compra pertenece a otro proveedor.");

      supplierPurchase = found;
    }

    const occurredAt = input.occurredAt ?? new Date();
    const amount = toDecimal(input.amount);
    const clampToZero = (value: Prisma.Decimal) =>
      value.lt(0) ? new Prisma.Decimal(0) : value;

    const paidAgg =
      supplierPurchase == null
        ? null
        : await tx.payment.aggregate({
            where: {
              direction: PaymentDirection.OUT,
              supplierPurchaseId: supplierPurchase.id,
            },
            _sum: { amount: true },
          });

    const paidTotal =
      paidAgg?._sum.amount != null
        ? (paidAgg._sum.amount as Prisma.Decimal)
        : new Prisma.Decimal(0);

    // Payment OUT (salida)
    const payment = await tx.payment.create({
      data: {
        salesNoteId: null,
        partyId,
        supplierPurchaseId,
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
        amount: true,
        reference: true,
        notes: true,
        occurredAt: true,
      },
    });

    if (payment.amount == null) {
      throw new Error("El monto del pago es requerido.");
    }

    if (payment.amount.lte(new Prisma.Decimal(0))) {
      throw new Error("El monto del pago debe ser mayor a 0.");
    }

    // Ledger: proveedor => PAYABLE (le debemos) -amount (reduce payable)
    const ledgerAmount = payment?.amount.mul(new Prisma.Decimal(-1));

    await upsertPartyLedgerEntry(tx, {
      partyId: payment.partyId!,
      side: PartyLedgerSide.PAYABLE,
      sourceType: PartyLedgerSourceType.PAYMENT,
      sourceId: payment.id,
      reference: payment.reference
        ? `Pago ${payment.reference}`
        : "Pago a proveedor",
      occurredAt: payment.occurredAt,
      amount: ledgerAmount, // ✅ negative reduces debt
      notes: payment.notes,
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
      const balanceBefore = clampToZero(
        supplierPurchase.total.sub(paidTotal)
      );
      const balanceAfter = clampToZero(
        supplierPurchase.total.sub(paidTotal.add(payment.amount))
      );

      await createAuditLog(tx, {
        eventKey: "supplierPurchase.payment.created",
        action: AuditAction.CREATE,
        entity: { type: AuditEntityType.PAYMENT, id: payment.id },
        rootEntity: {
          type: AuditEntityType.SUPPLIER_PURCHASE,
          id: supplierPurchase.id,
        },
        reference: payment.reference,
        occurredAt: payment.occurredAt,
        traceId: ctx?.traceId,
        actor,
        changes: [
          auditDecimalChange(
            AuditChangeKey.PAYMENT_AMOUNT,
            null,
            payment.amount
          ),
          auditDecimalChange(
            AuditChangeKey.SUPPLIER_PURCHASE_BALANCE_DUE,
            balanceBefore,
            balanceAfter
          ),
        ],
      });
    }

    logger.log("created", { paymentId: payment.id });
    return { paymentId: payment.id };
  });
}
