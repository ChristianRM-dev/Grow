import {
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

export type UpdatePartyPaymentOutInput = {
  partyId: string;
  paymentType: PaymentType; // <- reemplaza por PaymentType
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
      select: { id: true, direction: true, partyId: true, salesNoteId: true },
    });

    if (!existing) throw new Error("El pago no existe.");
    if (existing.direction !== PaymentDirection.OUT)
      throw new Error("Solo se permiten pagos de salida (OUT) aquí.");

    // opcional: restringe a pagos “de proveedor” (no ligados a salesNote)
    if (existing.salesNoteId)
      throw new Error(
        "Este pago pertenece a una nota de venta, usa el flujo correspondiente."
      );

    const occurredAt = input.occurredAt ?? new Date();
    const amount = toDecimal(input.amount);

    const updated = await tx.payment.update({
      where: { id },
      data: {
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

    logger.log("updated", { paymentId: updated.id });
    return { paymentId: updated.id };
  });
}
