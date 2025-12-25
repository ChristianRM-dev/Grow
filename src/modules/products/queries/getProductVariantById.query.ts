import { prisma } from "@/lib/prisma";

export type ProductVariantEditDto = {
  id: string;
  speciesName: string;
  variantName: string | null;
  bagSize: string | null;
  color: string | null;
  defaultPrice: string;
  isActive: boolean;
};

export async function getProductVariantById(
  id: string
): Promise<ProductVariantEditDto | null> {
  const row = await prisma.productVariant.findUnique({
    where: { id },
    select: {
      id: true,
      speciesName: true,
      variantName: true,
      bagSize: true,
      color: true,
      defaultPrice: true,
      isActive: true,
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    speciesName: row.speciesName,
    variantName: row.variantName,
    bagSize: row.bagSize,
    color: row.color,
    defaultPrice: row.defaultPrice.toString(),
    isActive: row.isActive,
  };
}
