// src/modules/products/queries/getProductsTable.query.ts
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  computeTotalPages,
  createTableQueryParser,
  type NextSearchParams,
} from "@/modules/shared/tables/tableQuery";

export type ProductVariantRowDto = {
  id: string;
  speciesName: string;
  variantName: string | null;
  bagSize: string | null;
  color: string | null;
  defaultPrice: string; // Decimal -> string to avoid float issues
  isActive: boolean;
  createdAt: string;
};

const allowedSortFields = [
  "createdAt",
  "speciesName",
  "variantName",
  "bagSize",
  "color",
  "defaultPrice",
  "isActive",
] as const;

const parseProductsTableQuery = createTableQueryParser({
  allowedSortFields,
  defaults: {
    page: 1,
    pageSize: 10,
    sortField: "createdAt",
    sortOrder: "desc",
  },
  pageSizeLimits: { min: 5, max: 50 },
});

function toPrismaOrderBy(sort?: {
  sortField: string;
  sortOrder: "asc" | "desc";
}): Prisma.ProductVariantOrderByWithRelationInput[] {
  if (!sort) return [{ createdAt: "desc" }];

  // sortField is already validated by whitelist at parse-time.
  const field =
    sort.sortField as keyof Prisma.ProductVariantOrderByWithRelationInput;

  return [
    {
      [field]: sort.sortOrder,
    } as Prisma.ProductVariantOrderByWithRelationInput,
  ];
}

export async function getProductsTable(searchParams: NextSearchParams) {
  const q = parseProductsTableQuery(searchParams);

  const where: Prisma.ProductVariantWhereInput | undefined = q.search?.term
    ? {
        OR: [
          { speciesName: { contains: q.search.term, mode: "insensitive" } },
          { variantName: { contains: q.search.term, mode: "insensitive" } },
          { bagSize: { contains: q.search.term, mode: "insensitive" } },
          { color: { contains: q.search.term, mode: "insensitive" } },
        ],
      }
    : undefined;

  const skip = (q.pagination.page - 1) * q.pagination.pageSize;
  const take = q.pagination.pageSize;

  const [totalItems, rows] = await Promise.all([
    prisma.productVariant.count({ where }),
    prisma.productVariant.findMany({
      where,
      orderBy: toPrismaOrderBy(q.sort),
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

  const totalPages = computeTotalPages(totalItems, q.pagination.pageSize);

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
      page: q.pagination.page,
      pageSize: q.pagination.pageSize,
      totalPages,
      totalItems,
    },
    query: q,
  };
}
