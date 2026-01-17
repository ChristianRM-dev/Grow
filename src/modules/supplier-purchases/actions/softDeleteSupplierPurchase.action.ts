"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { UserRole } from "@/generated/prisma/enums";

const SoftDeleteSupplierPurchaseSchema = z.object({
  id: z.string().min(1),
});

const SoftDeleteSupplierPurchaseInput = SoftDeleteSupplierPurchaseSchema;

// ✅ FIX: Agregamos el paréntesis de cierre después de typeof
export type SoftDeleteSupplierPurchaseInput = z.infer<
  typeof SoftDeleteSupplierPurchaseInput
>;

export async function softDeleteSupplierPurchaseAction(
  input: SoftDeleteSupplierPurchaseInput
) {
  console.info("softDeleteSupplierPurchaseAction", input);

  // Validate input at the boundary
  const { id } = SoftDeleteSupplierPurchaseInput.parse(input);

  // Session guard
  const session = await auth();
  if (!session?.user) {
    throw new Error("No autorizado.");
  }

  return await prisma.$transaction(async (tx) => {
    const now = new Date();

    // Verify purchase exists and is not already deleted
    const purchase = await tx.supplierPurchase.findUnique({
      where: { id },
      select: {
        id: true,
        isDeleted: true,
        supplierFolio: true,
        occurredAt: true,
        total: true,
        partyId: true,
        payments: {
          where: { isDeleted: false },
          select: { id: true },
        },
      },
    });

    if (!purchase) {
      throw new Error("Compra no encontrada.");
    }

    // Idempotent: if already deleted, just return success
    if (purchase.isDeleted) {
      return { ok: true as const, alreadyDeleted: true };
    }

    // 1. Soft-delete the supplier purchase
    await tx.supplierPurchase.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: now,
      },
    });

    // 2. Soft-delete all related payments (cascade)
    const deletedPayments = await tx.payment.updateMany({
      where: {
        supplierPurchaseId: id,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        deletedAt: now,
      },
    });

    // 3. Soft-delete the ledger entry for the purchase (PAYABLE)
    await tx.partyLedgerEntry.updateMany({
      where: {
        sourceType: "SUPPLIER_PURCHASE",
        sourceId: id,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        deletedAt: now,
      },
    });

    // 4. Soft-delete ledger entries for related payments
    if (purchase.payments.length > 0) {
      await tx.partyLedgerEntry.updateMany({
        where: {
          sourceType: "PAYMENT",
          sourceId: {
            in: purchase.payments.map((p) => p.id),
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
        actorRoleSnapshot: session.user.role as UserRole,
        action: "UPDATE",
        eventKey: "supplier_purchase.soft_deleted",
        entityType: "SUPPLIER_PURCHASE",
        entityId: id,
        rootEntityType: "SUPPLIER_PURCHASE",
        rootEntityId: id,
        reference: purchase.supplierFolio,
        occurredAt: purchase.occurredAt,
        meta: {
          total: purchase.total.toString(),
          paymentsCount: purchase.payments.length,
          deletedPaymentsCount: deletedPayments.count,
        },
        changes: {
          create: [
            {
              key: "SUPPLIER_PURCHASE_TOTAL",
              decimalBefore: purchase.total,
              decimalAfter: null, // null represents "deleted"
            },
          ],
        },
      },
    });

    // Revalidate affected pages
    revalidatePath("/supplier-purchases");
    revalidatePath(`/supplier-purchases/${id}`);
    revalidatePath(`/parties/${purchase.partyId}`);

    return {
      ok: true as const,
      deletedPaymentsCount: deletedPayments.count,
    };
  });
}
