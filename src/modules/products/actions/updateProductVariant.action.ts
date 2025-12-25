"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ProductVariantFinalSchema } from "@/modules/products/forms/productVariantForm.schemas";

const UpdateInputSchema = z.object({
  id: z.string().min(1),
  values: ProductVariantFinalSchema,
});

type UpdateResult = { id: string };

function emptyToNull(value: string | undefined | null) {
  const v = (value ?? "").trim();
  return v.length === 0 ? null : v;
}

export async function updateProductVariantAction(
  input: unknown
): Promise<UpdateResult> {
  const parsed = UpdateInputSchema.parse(input);
  const { id, values } = parsed;

  const updated = await prisma.productVariant.update({
    where: { id },
    data: {
      speciesName: values.speciesName.trim(),
      variantName: emptyToNull(values.variantName),
      bagSize: emptyToNull(values.bagSize),
      color: emptyToNull(values.color),
      defaultPrice: values.defaultPrice, // Prisma Decimal accepts string
      isActive: values.isActive,
    },
    select: { id: true },
  });

  return { id: updated.id };
}
