"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { UserRole } from "@/generated/prisma/enums";

const ToggleSalesNoteActiveSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean(),
});

export type ToggleSalesNoteActiveInput = z.infer<
  typeof ToggleSalesNoteActiveSchema
>;

export async function toggleSalesNoteActiveAction(
  input: ToggleSalesNoteActiveInput,
) {
  console.info("toggleSalesNoteActiveAction", input);

  const { id, isActive } = ToggleSalesNoteActiveSchema.parse(input);

  const session = await auth();
  if (!session?.user) {
    throw new Error("No autorizado.");
  }

  if (session.user.role === "READ_ONLY") {
    throw new Error("No tienes permisos para realizar esta acción.");
  }

  return await prisma.$transaction(async (tx) => {
    const now = new Date();

    const salesNote = await tx.salesNote.findUnique({
      where: { id },
      select: {
        id: true,
        folio: true,
        status: true,
        createdAt: true,
        total: true,
        subtotal: true,
        discountTotal: true,
        partyId: true,
        isDeleted: true,
        deletedAt: true,
        payments: {
          where: { isDeleted: false },
          select: { id: true },
        },
      },
    });

    if (!salesNote) {
      throw new Error("Nota de venta no encontrada.");
    }

    const targetStatus = isActive ? "CONFIRMED" : "CANCELLED";

    // Idempotency
    if (salesNote.status === targetStatus && salesNote.isDeleted === false) {
      return { ok: true as const, alreadyInTargetState: true };
    }

    // Always restore from legacy soft-delete flags (we don't want SalesNotes hidden anymore)
    // This makes the action safe to use even on old data.
    const baseSalesNoteUpdate = {
      isDeleted: false,
      deletedAt: null as Date | null,
    };

    if (!isActive) {
      // -------------------------
      // Deactivate (CANCELLED)
      // -------------------------

      await tx.salesNote.update({
        where: { id },
        data: {
          ...baseSalesNoteUpdate,
          status: "CANCELLED",
        },
      });

      // Soft-delete related payments so they don't affect totals/ledger
      const deletedPayments = await tx.payment.updateMany({
        where: { salesNoteId: id, isDeleted: false },
        data: { isDeleted: true, deletedAt: now },
      });

      // Soft-delete the receivable ledger entry for this sales note
      await tx.partyLedgerEntry.updateMany({
        where: {
          sourceType: "SALES_NOTE",
          sourceId: id,
          isDeleted: false,
        },
        data: { isDeleted: true, deletedAt: now },
      });

      // Soft-delete ledger entries for those payments
      if (salesNote.payments.length > 0) {
        await tx.partyLedgerEntry.updateMany({
          where: {
            sourceType: "PAYMENT",
            sourceId: { in: salesNote.payments.map((p) => p.id) },
            isDeleted: false,
          },
          data: { isDeleted: true, deletedAt: now },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          actorNameSnapshot: session.user.name ?? undefined,
          actorRoleSnapshot: session.user.role as UserRole,
          action: "UPDATE",
          eventKey: "sales_note.deactivated",
          entityType: "SALES_NOTE",
          entityId: id,
          rootEntityType: "SALES_NOTE",
          rootEntityId: id,
          reference: salesNote.folio,
          occurredAt: salesNote.createdAt,
          meta: {
            previousStatus: salesNote.status,
            newStatus: "CANCELLED",
            previousIsDeleted: salesNote.isDeleted,
            deletedPaymentsCount: deletedPayments.count,
            paymentsCount: salesNote.payments.length,
          },
          changes: {
            create: [
              {
                key: "SALES_NOTE_TOTAL",
                decimalBefore: salesNote.total,
                decimalAfter: salesNote.total,
              },
            ],
          },
        },
      });

      revalidatePath("/sales-notes");
      revalidatePath(`/sales-notes/${id}`);
      revalidatePath(`/parties/${salesNote.partyId}`);

      return {
        ok: true as const,
        status: "CANCELLED" as const,
        deletedPaymentsCount: deletedPayments.count,
      };
    }

    // -------------------------
    // Activate (CONFIRMED)
    // -------------------------

    // Only "reactivate" if it was cancelled; otherwise no-op but still normalize isDeleted flags.
    const nextStatus =
      salesNote.status === "CANCELLED" ? "CONFIRMED" : salesNote.status;

    await tx.salesNote.update({
      where: { id },
      data: {
        ...baseSalesNoteUpdate,
        status: nextStatus,
      },
    });

    // Restore (or create) ledger entry for sales note (receivable)
    // Uses the @@unique([sourceType, sourceId]) constraint.
    await tx.partyLedgerEntry.upsert({
      where: {
        sourceType_sourceId: {
          sourceType: "SALES_NOTE",
          sourceId: id,
        },
      },
      create: {
        partyId: salesNote.partyId,
        side: "RECEIVABLE",
        sourceType: "SALES_NOTE",
        sourceId: id,
        reference: salesNote.folio,
        occurredAt: salesNote.createdAt,
        amount: salesNote.total,
        notes: null,
        isDeleted: false,
        deletedAt: null,
      },
      update: {
        partyId: salesNote.partyId,
        side: "RECEIVABLE",
        reference: salesNote.folio,
        occurredAt: salesNote.createdAt,
        amount: salesNote.total,
        isDeleted: false,
        deletedAt: null,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actorNameSnapshot: session.user.name ?? undefined,
        actorRoleSnapshot: session.user.role as UserRole,
        action: "UPDATE",
        eventKey: "sales_note.activated",
        entityType: "SALES_NOTE",
        entityId: id,
        rootEntityType: "SALES_NOTE",
        rootEntityId: id,
        reference: salesNote.folio,
        occurredAt: salesNote.createdAt,
        meta: {
          previousStatus: salesNote.status,
          newStatus: nextStatus,
          previousIsDeleted: salesNote.isDeleted,
          note: "Payments were not restored on activation.",
        },
      },
    });

    revalidatePath("/sales-notes");
    revalidatePath(`/sales-notes/${id}`);
    revalidatePath(`/parties/${salesNote.partyId}`);

    return {
      ok: true as const,
      status: nextStatus,
    };
  });
}
