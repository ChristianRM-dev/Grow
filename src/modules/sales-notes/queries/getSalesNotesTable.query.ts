import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export type SalesNoteRowDto = {
  id: string;
  folio: string;
  createdAt: string; // ISO
  partyName: string;
  status: string;
  subtotal: string;
  discountTotal: string;
  total: string;
};

const SortOrderEnum = z.enum(["asc", "desc"]);

const SearchParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(10),
  sortField: z.string().optional(),
  sortOrder: SortOrderEnum.optional(),
  search: z.string().optional(),
});

type ParsedTableQuery = z.infer<typeof SearchParamsSchema>;

function toPrismaOrderBy(
  q: ParsedTableQuery
): Prisma.SalesNoteOrderByWithRelationInput[] | undefined {
  const sortField = (q.sortField ?? "createdAt").trim();
  const sortOrder = (q.sortOrder ?? "desc") as Prisma.SortOrder;

  // Map allowed fields to Prisma orderBy
  const allowed: Record<string, Prisma.SalesNoteOrderByWithRelationInput> = {
    createdAt: { createdAt: sortOrder },
    folio: { folio: sortOrder },
    status: { status: sortOrder },
    subtotal: { subtotal: sortOrder },
    discountTotal: { discountTotal: sortOrder },
    total: { total: sortOrder },
    // Party name sort (relation)
    partyName: { party: { name: sortOrder } },
  };

  const order = allowed[sortField] ?? { createdAt: sortOrder };

  // IMPORTANT: return a mutable array (avoids readonly type issues)
  return [order];
}

function toWhere(q: ParsedTableQuery): Prisma.SalesNoteWhereInput {
  const term = (q.search ?? "").trim();
  if (!term) return {};

  return {
    OR: [
      { folio: { contains: term, mode: "insensitive" } },
      { party: { name: { contains: term, mode: "insensitive" } } },
    ],
  };
}

export async function getSalesNotesTableQuery(rawSearchParams: unknown) {
  const parsed = SearchParamsSchema.safeParse(rawSearchParams ?? {});
  const q = parsed.success ? parsed.data : SearchParamsSchema.parse({});

  const where = toWhere(q);
  const orderBy = toPrismaOrderBy(q);

  const skip = (q.page - 1) * q.pageSize;
  const take = q.pageSize;

  const [totalItems, rows] = await Promise.all([
    prisma.salesNote.count({ where }),
    prisma.salesNote.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        folio: true,
        createdAt: true,
        status: true,
        subtotal: true,
        discountTotal: true,
        total: true,
        party: { select: { name: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / q.pageSize));

  const data: SalesNoteRowDto[] = rows.map((r) => ({
    id: r.id,
    folio: r.folio,
    createdAt: r.createdAt.toISOString(),
    partyName: r.party.name,
    status: String(r.status),
    subtotal: r.subtotal.toString(),
    discountTotal: r.discountTotal.toString(),
    total: r.total.toString(),
  }));

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
