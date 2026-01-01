import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  parseTableSearchParams,
  type ParsedTableQuery,
} from "@/modules/shared/tables/parseTableSearchParams";

export type QuotationRowDto = {
  id: string;
  folio: string;
  createdAt: string; // ISO
  partyName: string;
  total: string; // decimal string (0.00 if null)
};

function toPrismaOrderBy(
  q: ParsedTableQuery
): Prisma.QuotationOrderByWithRelationInput[] | undefined {
  const sortField = (q.sortField ?? "createdAt").trim();
  const sortOrder = (q.sortOrder ?? "desc") as Prisma.SortOrder;

  const allowed: Record<string, Prisma.QuotationOrderByWithRelationInput> = {
    createdAt: { createdAt: sortOrder },
    folio: { folio: sortOrder },
    total: { total: sortOrder },
    partyName: { party: { name: sortOrder } },
  };

  return [allowed[sortField] ?? { createdAt: sortOrder }];
}

function toWhere(q: ParsedTableQuery): Prisma.QuotationWhereInput {
  const term = (q.search ?? "").trim();
  if (!term) return {};

  return {
    OR: [
      { folio: { contains: term, mode: "insensitive" } },
      { party: { name: { contains: term, mode: "insensitive" } } },
    ],
  };
}

export async function getQuotationsTableQuery(rawSearchParams: unknown) {
  const q = parseTableSearchParams(rawSearchParams);

  const where = toWhere(q);
  const orderBy = toPrismaOrderBy(q);

  const skip = (q.page - 1) * q.pageSize;
  const take = q.pageSize;

  const [totalItems, rows] = await Promise.all([
    prisma.quotation.count({ where }),
    prisma.quotation.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        folio: true,
        createdAt: true,
        total: true,
        party: { select: { name: true } },
      },
    }),
  ]);

  const data: QuotationRowDto[] = rows.map((r) => ({
    id: r.id,
    folio: r.folio,
    createdAt: r.createdAt.toISOString(),
    partyName: r.party.name,
    total: (r.total ?? new Prisma.Decimal(0)).toString(),
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
