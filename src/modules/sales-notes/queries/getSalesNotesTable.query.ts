import { prisma } from "@/lib/prisma";
import { Prisma, PaymentDirection } from "@/generated/prisma/client";
import {
  parseTableSearchParams,
  type ParsedTableQuery,
} from "@/modules/shared/tables/parseTableSearchParams";
import {
  excludeSoftDeleted,
  excludeSoftDeletedPayments,
} from "@/modules/shared/queries/softDeleteHelpers";

export type SalesNoteRowDto = {
  id: string;
  folio: string;
  createdAt: string; // ISO
  partyName: string;

  total: string;
  paidTotal: string;
  remainingTotal: string;
  isFullyPaid: boolean;
};

function toPrismaOrderBy(
  q: ParsedTableQuery
): Prisma.SalesNoteOrderByWithRelationInput[] | undefined {
  const sortField = (q.sortField ?? "createdAt").trim();
  const sortOrder = (q.sortOrder ?? "desc") as Prisma.SortOrder;

  const allowed: Record<string, Prisma.SalesNoteOrderByWithRelationInput> = {
    createdAt: { createdAt: sortOrder },
    folio: { folio: sortOrder },
    total: { total: sortOrder },
    partyName: { party: { name: sortOrder } },
  };

  return [allowed[sortField] ?? { createdAt: sortOrder }];
}

function toWhere(q: ParsedTableQuery): Prisma.SalesNoteWhereInput {
  const term = (q.search ?? "").trim();

  // Base filter: always exclude soft-deleted records
  const baseWhere: Prisma.SalesNoteWhereInput = {
    ...excludeSoftDeleted,
  };

  if (!term) return baseWhere;

  return {
    ...baseWhere,
    OR: [
      { folio: { contains: term, mode: "insensitive" } },
      { party: { name: { contains: term, mode: "insensitive" } } },
    ],
  };
}

export async function getSalesNotesTableQuery(rawSearchParams: unknown) {
  const q = parseTableSearchParams(rawSearchParams);

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
        total: true,
        party: { select: { name: true } },
      },
    }),
  ]);

  const ids = rows.map((r) => r.id);

  const paidGroups = ids.length
    ? await prisma.payment.groupBy({
        by: ["salesNoteId"],
        where: {
          salesNoteId: { in: ids },
          direction: PaymentDirection.IN,
          ...excludeSoftDeletedPayments, // ← Filtrar pagos eliminados
        },
        _sum: { amount: true },
      })
    : [];

  const paidByNoteId = new Map<string, Prisma.Decimal>();
  for (const g of paidGroups) {
    if (!g.salesNoteId) continue;
    paidByNoteId.set(
      g.salesNoteId,
      (g._sum.amount ?? new Prisma.Decimal(0)) as Prisma.Decimal
    );
  }

  const data: SalesNoteRowDto[] = rows.map((r) => {
    const paid = paidByNoteId.get(r.id) ?? new Prisma.Decimal(0);
    const remainingRaw = (r.total as Prisma.Decimal).sub(paid);
    const remaining = remainingRaw.lt(0) ? new Prisma.Decimal(0) : remainingRaw;

    return {
      id: r.id,
      folio: r.folio,
      createdAt: r.createdAt.toISOString(),
      partyName: r.party.name,
      total: (r.total as Prisma.Decimal).toString(),
      paidTotal: paid.toString(),
      remainingTotal: remaining.toString(),
      isFullyPaid: remaining.lte(0),
    };
  });

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
