import { PaymentDirection, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  PARTY_SALES_NOTES_QUERY_PREFIX,
  type PartySalesNotePaymentStatus,
} from "@/modules/parties/queries/partySalesNotesQuery";
import { excludeSoftDeletedPayments } from "@/modules/shared/queries/softDeleteHelpers";
import {
  parseTableSearchParams,
  type ParsedTableQuery,
} from "@/modules/shared/tables/parseTableSearchParams";
import {
  computeOutstandingBalance,
  decimalToString,
  mapDecimalSumsByKey,
} from "@/modules/shared/utils/decimals";
import {
  readPrefixedParam,
} from "@/modules/shared/tables/prefixedTableQuery";

export type PartySalesNotesQuery = ParsedTableQuery & {
  paymentStatus: PartySalesNotePaymentStatus;
  from: string;
  to: string;
};

export type PartySalesNoteRowDto = {
  id: string;
  folio: string;
  createdAt: string; // ISO
  paymentStatus: "PAID" | "PENDING" | "CANCELLED";
  total: string;
  paidTotal: string;
  remainingTotal: string;
  isFullyPaid: boolean;
};

export type PartySalesNotesTableResult = {
  data: PartySalesNoteRowDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
  query: PartySalesNotesQuery;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pickFirst(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function startOfDayUtc(dateOnly: string) {
  return new Date(`${dateOnly}T00:00:00.000Z`);
}

function addDaysUtc(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function normalizeDateRange(from: string, to: string) {
  const validFrom = isDateOnly(from) ? from : "";
  const validTo = isDateOnly(to) ? to : "";

  if (validFrom && validTo && validFrom > validTo) {
    return { from: validTo, to: validFrom };
  }

  return { from: validFrom, to: validTo };
}

function toOrderBy(q: ParsedTableQuery): Prisma.SalesNoteOrderByWithRelationInput[] {
  const sortField = (q.sortField ?? "createdAt").trim();
  const sortOrder = (q.sortOrder ?? "desc") as Prisma.SortOrder;

  const allowed: Record<string, Prisma.SalesNoteOrderByWithRelationInput> = {
    createdAt: { createdAt: sortOrder },
    folio: { folio: sortOrder },
    total: { total: sortOrder },
  };

  return [allowed[sortField] ?? { createdAt: sortOrder }, { id: "desc" }];
}

function normalizeSortQuery(q: ParsedTableQuery): ParsedTableQuery {
  const sortField = (q.sortField ?? "").trim();
  const sortOrder = (q.sortOrder ?? "").trim();

  return {
    ...q,
    sortField: ["createdAt", "folio", "total"].includes(sortField)
      ? sortField
      : undefined,
    sortOrder: sortOrder === "asc" || sortOrder === "desc" ? sortOrder : undefined,
  };
}

function toBaseQuery(searchParams: Record<string, string | string[] | undefined>) {
  return parseTableSearchParams({
    page: pickFirst(readPrefixedParam(searchParams, PARTY_SALES_NOTES_QUERY_PREFIX, "page")),
    pageSize: pickFirst(
      readPrefixedParam(searchParams, PARTY_SALES_NOTES_QUERY_PREFIX, "pageSize"),
    ),
    sortField: pickFirst(
      readPrefixedParam(searchParams, PARTY_SALES_NOTES_QUERY_PREFIX, "sortField"),
    ),
    sortOrder: pickFirst(
      readPrefixedParam(searchParams, PARTY_SALES_NOTES_QUERY_PREFIX, "sortOrder"),
    ),
    search: pickFirst(readPrefixedParam(searchParams, PARTY_SALES_NOTES_QUERY_PREFIX, "search")),
  });
}

function toPaymentStatus(
  raw: string | undefined,
): PartySalesNotePaymentStatus {
  return raw === "paid" || raw === "pending" ? raw : "all";
}

export async function getPartySalesNotesTableQuery(params: {
  partyId: string;
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<PartySalesNotesTableResult> {
  const { partyId, searchParams } = params;
  const baseQuery = toBaseQuery(searchParams);
  const q = normalizeSortQuery(baseQuery);

  const paymentStatus = toPaymentStatus(
    readPrefixedParam(searchParams, PARTY_SALES_NOTES_QUERY_PREFIX, "paymentStatus"),
  );
  const from = readPrefixedParam(searchParams, PARTY_SALES_NOTES_QUERY_PREFIX, "from") ?? "";
  const to = readPrefixedParam(searchParams, PARTY_SALES_NOTES_QUERY_PREFIX, "to") ?? "";
  const { from: normalizedFrom, to: normalizedTo } = normalizeDateRange(from, to);

  const term = String(q.search ?? "").trim();

  const where: Prisma.SalesNoteWhereInput = {
    partyId,
  };

  if (normalizedFrom || normalizedTo) {
    const createdAt: Prisma.DateTimeFilter = {};

    if (normalizedFrom) {
      createdAt.gte = startOfDayUtc(normalizedFrom);
    }

    if (normalizedTo) {
      createdAt.lt = addDaysUtc(startOfDayUtc(normalizedTo), 1);
    }

    where.createdAt = createdAt;
  }

  if (term) {
    where.OR = [{ folio: { contains: term, mode: "insensitive" } }];
  }

  const orderBy = toOrderBy(q);

  const notes = await prisma.salesNote.findMany({
    where,
    orderBy,
    select: {
      id: true,
      folio: true,
      createdAt: true,
      status: true,
      total: true,
    },
  });

  const ids = notes.map((note) => note.id);

  const paidGroups = ids.length
    ? await prisma.payment.groupBy({
        by: ["salesNoteId"],
        where: {
          salesNoteId: { in: ids },
          direction: PaymentDirection.IN,
          ...excludeSoftDeletedPayments,
        },
        _sum: { amount: true },
      })
    : [];

  const paidByNoteId = mapDecimalSumsByKey(paidGroups, "salesNoteId");

  const mapped = notes.map((note) => {
    const { isFullyPaid, paid, remaining } = computeOutstandingBalance({
      total: note.total,
      paid: paidByNoteId.get(note.id),
    });

    const paymentState = note.status === "CANCELLED"
      ? "CANCELLED"
      : isFullyPaid
        ? "PAID"
        : "PENDING";

    return {
      id: note.id,
      folio: note.folio,
      createdAt: note.createdAt.toISOString(),
      paymentStatus: paymentState,
      total: decimalToString(note.total),
      paidTotal: decimalToString(paid),
      remainingTotal: decimalToString(remaining),
      isFullyPaid,
    } satisfies PartySalesNoteRowDto;
  });

  const filtered =
    paymentStatus === "all"
      ? mapped
      : mapped.filter((note) => {
          if (note.paymentStatus === "CANCELLED") return false;
          if (paymentStatus === "paid") return note.isFullyPaid;
          return !note.isFullyPaid;
        });

  const totalItems = filtered.length;
  const pageSize = clamp(q.pageSize, 5, 50);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = clamp(q.page, 1, totalPages);
  const skip = (page - 1) * pageSize;
  const data = filtered.slice(skip, skip + pageSize);

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalPages,
      totalItems,
    },
    query: {
      ...q,
      pageSize,
      paymentStatus,
      from: normalizedFrom,
      to: normalizedTo,
    },
  };
}
