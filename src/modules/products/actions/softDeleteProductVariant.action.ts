// src/modules/products/actions/softDeleteProductVariant.action.ts
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const SoftDeleteProductVariantSchema = z.object({
  id: z.string().min(1),
});

export type SoftDeleteProductVariantInput = z.infer<
  typeof SoftDeleteProductVariantSchema
>;

export async function softDeleteProductVariantAction(
  input: SoftDeleteProductVariantInput
) {
  console.info("softDeleteProductVariantAction", input);

  // Validate input at the boundary
  const { id } = SoftDeleteProductVariantSchema.parse(input);

  // Session guard
  const session = await auth();
  if (!session?.user) {
    throw new Error("No autorizado.");
  }

  return await prisma.$transaction(async (tx) => {
    const now = new Date();

    // Verify product exists and is not already deleted
    const product = await tx.productVariant.findUnique({
      where: { id },
      select: {
        id: true,
        isDeleted: true,
        speciesName: true,
        variantName: true,
        defaultPrice: true,
        // ⚠️ Check for references in documents
        _count: {
          select: {
            salesNoteLines: {
              where: {
                salesNote: { isDeleted: false },
              },
            },
            quotationLines: {
              where: {
                quotation: { isDeleted: false },
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new Error("Producto no encontrado.");
    }

    // Idempotent: if already deleted, just return success
    if (product.isDeleted) {
      return { ok: true as const, alreadyDeleted: true };
    }

    // ⚠️ CRITICAL: Prevent deletion if product is referenced in active documents
    const hasActiveReferences =
      product._count.salesNoteLines > 0 || product._count.quotationLines > 0;

    if (hasActiveReferences) {
      throw new Error(
        `No se puede eliminar este producto porque está siendo usado en ${product._count.salesNoteLines} nota(s) de venta y ${product._count.quotationLines} cotización(es) activa(s). Considera desactivarlo en lugar de eliminarlo.`
      );
    }

    // 1. Soft-delete the product variant
    await tx.productVariant.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: now,
        isActive: false, // También lo desactivamos
      },
    });

    // 2. Register audit log (optional, if you have audit for products)
    // Note: Currently your schema doesn't have AuditEntityType.PRODUCT_VARIANT
    // You would need to add it to the enum if you want full audit trail

    // Revalidate affected pages
    revalidatePath("/products");
    revalidatePath(`/products/${id}`);

    const displayName = product.variantName
      ? `${product.speciesName} - ${product.variantName}`
      : product.speciesName;

    return {
      ok: true as const,
      productName: displayName,
    };
  });
}
