import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { parseTableSearchParams } from "@/modules/shared/tables/parseTableSearchParams";

export type ProductVariantRowDto = {
  id: string;
  speciesName: string;
  variantName: string | null;
  bagSize: string | null;
  color: string | null;
  defaultPrice: string; // Decimal -> string to avoid float issues
  isActive: boolean;
  createdAt: string; // ISO
};

const allowedSortFields = new Set([
  "createdAt",
  "speciesName",
  "variantName",
  "bagSize",
  "color",
  "defaultPrice",
  "isActive",
]);

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toPrismaOrderBy(q: {
  sortField?: string;
  sortOrder?: "asc" | "desc";
}): Prisma.ProductVariantOrderByWithRelationInput[] {
  const rawField = String(q.sortField ?? "createdAt").trim();
  const field = allowedSortFields.has(rawField) ? rawField : "createdAt";
  const order = (q.sortOrder ?? "desc") as Prisma.SortOrder;

  // The cast is safe because field is whitelisted.
  return [{ [field]: order } as Prisma.ProductVariantOrderByWithRelationInput];
}

function toWhere(search?: string): Prisma.ProductVariantWhereInput | undefined {
  const term = String(search ?? "").trim();
  if (!term) return undefined;

  return {
    isDeleted: false,
    OR: [
      { speciesName: { contains: term, mode: "insensitive" } },
      { variantName: { contains: term, mode: "insensitive" } },
      { bagSize: { contains: term, mode: "insensitive" } },
      { color: { contains: term, mode: "insensitive" } },
    ],
  };
}

export async function getProductsTable(
  rawSearchParams: Record<string, string | string[] | undefined>
) {
  const parsed = parseTableSearchParams(rawSearchParams);

  // Keep previous limits: min 5, max 50
  const pageSize = clamp(parsed.pageSize, 5, 50);
  const page = Math.max(1, parsed.page);

  const where = toWhere(parsed.search);

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const [totalItems, rows] = await Promise.all([
    prisma.productVariant.count({ where }),
    prisma.productVariant.findMany({
      where,
      orderBy: toPrismaOrderBy({
        sortField: parsed.sortField,
        sortOrder: parsed.sortOrder,
      }),
      skip,
      take,
      select: {
        id: true,
        speciesName: true,
        variantName: true,
        bagSize: true,
        color: true,
        defaultPrice: true,
        isActive: true,
        createdAt: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    data: rows.map((r) => ({
      id: r.id,
      speciesName: r.speciesName,
      variantName: r.variantName,
      bagSize: r.bagSize,
      color: r.color,
      defaultPrice: r.defaultPrice.toString(),
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString(),
    })) satisfies ProductVariantRowDto[],
    pagination: {
      page,
      pageSize,
      totalPages,
      totalItems,
    },
  };
}
