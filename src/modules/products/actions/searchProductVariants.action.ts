"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

const InputSchema = z.object({
  term: z.string().trim().max(80).optional().default(""),
  excludeIds: z.array(z.string()).optional().default([]),
  take: z.number().int().min(1).max(25).optional().default(10),
});

export type ProductVariantLookupDto = {
  id: string;
  label: string; // Spanish UI-friendly label
  defaultPrice: string; // Decimal string
  descriptionSuggestion: string; // derived from bagSize/color
};

export async function searchProductVariantsAction(
  input: unknown
): Promise<ProductVariantLookupDto[]> {
  const { term, excludeIds, take } = InputSchema.parse(input);
  const q = term.trim();

  const where =
    q.length >= 2
      ? {
          isActive: true,
          id: excludeIds.length > 0 ? { notIn: excludeIds } : undefined,
          OR: [
            { speciesName: { contains: q, mode: "insensitive" as const } },
            { variantName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {
          isActive: true,
          id: excludeIds.length > 0 ? { notIn: excludeIds } : undefined,
        };

  const rows = await prisma.productVariant.findMany({
    where,
    select: {
      id: true,
      speciesName: true,
      variantName: true,
      bagSize: true,
      color: true,
      defaultPrice: true,
    },
    orderBy: [{ speciesName: "asc" }, { variantName: "asc" }],
    take,
  });

  return rows.map((r) => {
    const parts = [
      r.speciesName,
      r.variantName ? `- ${r.variantName}` : null,
      r.bagSize ? `(${r.bagSize})` : null,
      r.color ? `• ${r.color}` : null,
    ].filter(Boolean);

    const descriptionSuggestion = [r.bagSize, r.color]
      .filter(Boolean)
      .join(" · ");

    return {
      id: r.id,
      label: parts.join(" "),
      defaultPrice: r.defaultPrice.toString(),
      descriptionSuggestion,
    };
  });
}
