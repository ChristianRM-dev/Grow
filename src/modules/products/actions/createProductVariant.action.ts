"use server";

import { prisma } from "@/lib/prisma";
import { ProductVariantFinalSchema } from "@/modules/products/forms/productVariantForm.schemas";

type CreateProductVariantResult = {
  id: string;
};

function emptyToNull(value: string | undefined | null) {
  const v = (value ?? "").trim();
  return v.length === 0 ? null : v;
}

export async function createProductVariantAction(
  input: unknown
): Promise<CreateProductVariantResult> {
  const values = ProductVariantFinalSchema.parse(input);

  const created = await prisma.productVariant.create({
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

  return { id: created.id };
}
