import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  parseTableSearchParams,
  type ParsedTableQuery,
} from "@/modules/shared/tables/parseTableSearchParams";

export type SupplierPurchaseRowDto = {
  id: string;
  supplierName: string;
  supplierFolio: string;
  total: string; // Decimal -> string
  createdAt: string; // ISO
  occurredAt: Date;
};

function toPrismaOrderBy(
  q: ParsedTableQuery
): Prisma.SupplierPurchaseOrderByWithRelationInput[] | undefined {
  const sortField = (q.sortField ?? "createdAt").trim();
  const sortOrder = (q.sortOrder ?? "desc") as Prisma.SortOrder;

  // ✅ FIX: Agregamos el segundo tipo genérico
  const allowed: Record<
    string,
    Prisma.SupplierPurchaseOrderByWithRelationInput
  > = {
    createdAt: { createdAt: sortOrder },
    supplierFolio: { supplierFolio: sortOrder },
    total: { total: sortOrder },
    supplierName: { party: { name: sortOrder } },
  };

  return [allowed[sortField] ?? { createdAt: sortOrder }];
}

function toWhere(q: ParsedTableQuery): Prisma.SupplierPurchaseWhereInput {
  const term = (q.search ?? "").trim();

  // Base filter: always exclude soft-deleted records
  const baseWhere: Prisma.SupplierPurchaseWhereInput = {
    isDeleted: false,
  };

  if (!term) return baseWhere;

  return {
    ...baseWhere,
    OR: [
      { supplierFolio: { contains: term, mode: "insensitive" } },
      { party: { name: { contains: term, mode: "insensitive" } } },
      { notes: { contains: term, mode: "insensitive" } },
    ],
  };
}

export async function getSupplierPurchasesTableQuery(rawSearchParams: unknown) {
  const q = parseTableSearchParams(rawSearchParams);

  const where = toWhere(q);
  const orderBy = toPrismaOrderBy(q);

  const skip = (q.page - 1) * q.pageSize;
  const take = q.pageSize;

  const [totalItems, rows] = await Promise.all([
    prisma.supplierPurchase.count({ where }),
    prisma.supplierPurchase.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        supplierFolio: true,
        total: true,
        createdAt: true,
        occurredAt: true,
        party: { select: { name: true } },
      },
    }),
  ]);

  const data: SupplierPurchaseRowDto[] = rows.map((r) => ({
    id: r.id,
    supplierName: r.party.name,
    supplierFolio: r.supplierFolio,
    total: (r.total as Prisma.Decimal).toString(),
    createdAt: r.createdAt.toISOString(),
    occurredAt: r.occurredAt,
  }));

  const totalPages = Math.max(1, Math.ceil(totalItems / q.pageSize));

  return {
    data,
    pagination: {
      page: q.page,
      pageSize: q.pageSize,
      totalPages,
      totalItems,
    },
  };
}
