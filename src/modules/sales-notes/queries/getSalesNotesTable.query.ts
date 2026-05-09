import { prisma } from "@/lib/prisma";
import { Prisma, PaymentDirection } from "@/generated/prisma/client";
import {
  parseTableSearchParams,
  type ParsedTableQuery,
} from "@/modules/shared/tables/parseTableSearchParams";
import { excludeSoftDeletedPayments } from "@/modules/shared/queries/softDeleteHelpers";
import {
  computeOutstandingBalance,
  decimalToString,
  mapDecimalSumsByKey,
} from "@/modules/shared/utils/decimals";

export type SalesNoteRowDto = {
  id: string;
  folio: string;
  createdAt: string; // ISO
  partyName: string;

  status: "DRAFT" | "CONFIRMED" | "CANCELLED";

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
    status: { status: sortOrder },
  };

  return [allowed[sortField] ?? { createdAt: sortOrder }];
}

function toWhere(q: ParsedTableQuery): Prisma.SalesNoteWhereInput {
  const term = (q.search ?? "").trim();

  // IMPORTANT:
  // SalesNotes are no longer hidden by soft-delete.
  // We show all and rely on `status` to indicate "cancelled".
  const baseWhere: Prisma.SalesNoteWhereInput = {};

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
        status: true,
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
          ...excludeSoftDeletedPayments, // payments may be soft-deleted (cancel flow)
        },
        _sum: { amount: true },
      })
    : [];

  const paidByNoteId = mapDecimalSumsByKey(paidGroups, "salesNoteId");

  const data: SalesNoteRowDto[] = rows.map((r) => {
    const { isFullyPaid, paid, remaining, total } = computeOutstandingBalance({
      total: r.total as Prisma.Decimal,
      paid: paidByNoteId.get(r.id),
    });

    return {
      id: r.id,
      folio: r.folio,
      createdAt: r.createdAt.toISOString(),
      partyName: r.party.name,
      status: r.status,
      total: decimalToString(total),
      paidTotal: decimalToString(paid),
      remainingTotal: decimalToString(remaining),
      // Business choice:
      // if cancelled, we treat it as "not payable" (disable payment anyway in UI),
      // but keeping the original computation is fine for display.
      isFullyPaid,
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
