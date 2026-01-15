// src/modules/products/actions/toggleProductVariantActive.action.ts
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const ToggleProductVariantActiveSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean(),
});

export type ToggleProductVariantActiveInput = z.infer<
  typeof ToggleProductVariantActiveSchema
>;

export async function toggleProductVariantActiveAction(
  input: ToggleProductVariantActiveInput
) {
  console.info("toggleProductVariantActiveAction", input);

  // Validate input at the boundary
  const { id, isActive } = ToggleProductVariantActiveSchema.parse(input);

  // Session guard
  const session = await auth();
  if (!session?.user) {
    throw new Error("No autorizado.");
  }

  return await prisma.$transaction(async (tx) => {
    // Verify product exists and is not deleted
    const product = await tx.productVariant.findUnique({
      where: { id },
      select: {
        id: true,
        isDeleted: true,
        speciesName: true,
        variantName: true,
        isActive: true,
      },
    });

    if (!product) {
      throw new Error("Producto no encontrado.");
    }

    if (product.isDeleted) {
      throw new Error("No se puede modificar un producto eliminado.");
    }

    // Toggle active state
    await tx.productVariant.update({
      where: { id },
      data: {
        isActive,
        updatedAt: new Date(),
      },
    });

    // Revalidate affected pages
    revalidatePath("/products");
    revalidatePath(`/products/${id}`);

    const displayName = product.variantName
      ? `${product.speciesName} - ${product.variantName}`
      : product.speciesName;

    return {
      ok: true as const,
      productName: displayName,
      isActive,
    };
  });
}
