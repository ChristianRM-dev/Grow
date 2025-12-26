import {
  PaymentDirection,
  PartyLedgerSide,
  PartyLedgerSourceType,
  Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import {
  createScopedLogger,
  type UseCaseContext,
} from "@/modules/shared/observability/scopedLogger";
import { toDecimal } from "@/modules/shared/utils/decimals";
import { safeTrim } from "@/modules/shared/utils/strings";
import { upsertPartyLedgerEntry } from "@/modules/shared/ledger/upsertPartyLedgerEntry";

export type CreatePartyPaymentOutInput = {
  partyId: string;
  paymentType: any; // <- pon tu PaymentType importado donde corresponda
  amount: string; // decimal string
  reference?: string; // folio/ref
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

    const party = await tx.party.findFirst({
      where: { id: partyId, isDeleted: false },
      select: { id: true, name: true },
    });
    if (!party) throw new Error("El proveedor no existe o está eliminado.");

    const occurredAt = input.occurredAt ?? new Date();
    const amount = toDecimal(input.amount);

    // Payment OUT (salida)
    const payment = await tx.payment.create({
      data: {
        salesNoteId: null,
        partyId,
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

    // Ledger: proveedor => PAYABLE (le debemos) -amount (reduce payable)
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
      amount: ledgerAmount, // ✅ negative reduces debt
      notes: payment.notes,
    });

    logger.log("created", { paymentId: payment.id });
    return { paymentId: payment.id };
  });
}
