"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { UserRole } from "@/generated/prisma/enums";

const SoftDeleteSalesNoteSchema = z.object({
  id: z.string().min(1),
});

const SoftDeleteSalesNoteInput = SoftDeleteSalesNoteSchema;
export type SoftDeleteSalesNoteInput = z.infer<typeof SoftDeleteSalesNoteInput>;

export async function softDeleteSalesNoteAction(
  input: SoftDeleteSalesNoteInput
) {
  console.info("softDeleteSalesNoteAction", input);

  const { id } = SoftDeleteSalesNoteInput.parse(input);

  const session = await auth();
  if (!session?.user) {
    throw new Error("No autorizado.");
  }

  return await prisma.$transaction(async (tx) => {
    const now = new Date();

    // Verify sales note exists and is not already deleted
    const salesNote = await tx.salesNote.findUnique({
      where: { id },
      select: {
        id: true,
        isDeleted: true,
        folio: true,
        createdAt: true,
        total: true,
        subtotal: true,
        discountTotal: true,
        partyId: true,
        payments: {
          where: { isDeleted: false },
          select: { id: true },
        },
      },
    });

    if (!salesNote) {
      throw new Error("Nota de venta no encontrada.");
    }

    // Idempotent: if already deleted, just return success
    if (salesNote.isDeleted) {
      return { ok: true as const, alreadyDeleted: true };
    }

    // 1. Soft-delete the sales note
    await tx.salesNote.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: now,
      },
    });

    // 2. Soft-delete all related payments (cascade)
    const deletedPayments = await tx.payment.updateMany({
      where: {
        salesNoteId: id,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        deletedAt: now,
      },
    });

    // 3. Soft-delete the ledger entry for the sales note (RECEIVABLE)
    await tx.partyLedgerEntry.updateMany({
      where: {
        sourceType: "SALES_NOTE",
        sourceId: id,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        deletedAt: now,
      },
    });

    // 4. Soft-delete ledger entries for related payments
    if (salesNote.payments.length > 0) {
      await tx.partyLedgerEntry.updateMany({
        where: {
          sourceType: "PAYMENT",
          sourceId: {
            in: salesNote.payments.map((p) => p.id),
          },
          isDeleted: false,
        },
        data: {
          isDeleted: true,
          deletedAt: now,
        },
      });
    }

    // 5. Register audit log
    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actorNameSnapshot: session.user.name ?? undefined,
        actorRoleSnapshot: session.user.role as UserRole, // ← CAST TO UserRole
        action: "UPDATE",
        eventKey: "sales_note.soft_deleted",
        entityType: "SALES_NOTE",
        entityId: id,
        rootEntityType: "SALES_NOTE",
        rootEntityId: id,
        reference: salesNote.folio,
        occurredAt: salesNote.createdAt,
        meta: {
          total: salesNote.total.toString(),
          subtotal: salesNote.subtotal.toString(),
          discountTotal: salesNote.discountTotal.toString(),
          paymentsCount: salesNote.payments.length,
          deletedPaymentsCount: deletedPayments.count,
        },
        changes: {
          create: [
            {
              key: "SALES_NOTE_TOTAL",
              decimalBefore: salesNote.total,
              decimalAfter: null, // null represents "deleted"
            },
            {
              key: "SALES_NOTE_SUBTOTAL",
              decimalBefore: salesNote.subtotal,
              decimalAfter: null,
            },
            {
              key: "SALES_NOTE_DISCOUNT_TOTAL",
              decimalBefore: salesNote.discountTotal,
              decimalAfter: null,
            },
          ],
        },
      },
    });

    // Revalidate affected pages
    revalidatePath("/sales-notes");
    revalidatePath(`/sales-notes/${id}`);
    revalidatePath(`/parties/${salesNote.partyId}`);

    return {
      ok: true as const,
      deletedPaymentsCount: deletedPayments.count,
    };
  });
}
