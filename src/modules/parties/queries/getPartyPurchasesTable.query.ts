import { PaymentDirection, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { excludeSoftDeletedPayments } from "@/modules/shared/queries/softDeleteHelpers";
import {
  parseTableSearchParams,
  type ParsedTableQuery,
} from "@/modules/shared/tables/parseTableSearchParams";
import {
  readPrefixedParam,
} from "@/modules/shared/tables/prefixedTableQuery";
import {
  computeOutstandingBalance,
  decimalToString,
  mapDecimalSumsByKey,
} from "@/modules/shared/utils/decimals";
import {
  PARTY_PURCHASES_QUERY_PREFIX,
  type PartyPurchasePaymentStatusFilter,
  type PartyPurchaseRowDto,
  type PartyPurchasesQuery,
  type PartyPurchasesTableResult,
} from "@/modules/parties/queries/partyPurchasesQuery";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
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

function toPaymentStatus(
  raw: string | undefined,
): PartyPurchasePaymentStatusFilter {
  return raw === "paid" || raw === "pending" ? raw : "all";
}

function toOrderBy(
  q: ParsedTableQuery,
): Prisma.SupplierPurchaseOrderByWithRelationInput[] {
  const sortField = (q.sortField ?? "occurredAt").trim();
  const sortOrder = (q.sortOrder ?? "desc") as Prisma.SortOrder;

  const allowed: Record<string, Prisma.SupplierPurchaseOrderByWithRelationInput> = {
    occurredAt: { occurredAt: sortOrder },
    supplierFolio: { supplierFolio: sortOrder },
    total: { total: sortOrder },
  };

  return [allowed[sortField] ?? { occurredAt: sortOrder }, { id: "desc" }];
}

function normalizeSortQuery(q: ParsedTableQuery): ParsedTableQuery {
  const sortField = (q.sortField ?? "").trim();
  const sortOrder = (q.sortOrder ?? "").trim();

  return {
    ...q,
    sortField: ["occurredAt", "supplierFolio", "total"].includes(sortField)
      ? sortField
      : undefined,
    sortOrder: sortOrder === "asc" || sortOrder === "desc" ? sortOrder : undefined,
  };
}

function toWhere(
  partyId: string,
  search?: string,
  from?: string,
  to?: string,
): Prisma.SupplierPurchaseWhereInput {
  const term = String(search ?? "").trim();
  const where: Prisma.SupplierPurchaseWhereInput = {
    partyId,
    isDeleted: false,
  };

  const { from: normalizedFrom, to: normalizedTo } = normalizeDateRange(
    String(from ?? ""),
    String(to ?? ""),
  );

  if (normalizedFrom || normalizedTo) {
    const occurredAt: Prisma.DateTimeFilter = {};
    if (normalizedFrom) occurredAt.gte = startOfDayUtc(normalizedFrom);
    if (normalizedTo) occurredAt.lt = addDaysUtc(startOfDayUtc(normalizedTo), 1);
    where.occurredAt = occurredAt;
  }

  if (term) {
    where.OR = [
      { supplierFolio: { contains: term, mode: "insensitive" } },
      { notes: { contains: term, mode: "insensitive" } },
    ];
  }

  return where;
}

function toQuery(
  searchParams: Record<string, string | string[] | undefined>,
): PartyPurchasesQuery {
  const base = parseTableSearchParams({
    page: readPrefixedParam(searchParams, PARTY_PURCHASES_QUERY_PREFIX, "page"),
    pageSize: readPrefixedParam(
      searchParams,
      PARTY_PURCHASES_QUERY_PREFIX,
      "pageSize",
    ),
    sortField: readPrefixedParam(
      searchParams,
      PARTY_PURCHASES_QUERY_PREFIX,
      "sortField",
    ),
    sortOrder: readPrefixedParam(
      searchParams,
      PARTY_PURCHASES_QUERY_PREFIX,
      "sortOrder",
    ),
    search: readPrefixedParam(searchParams, PARTY_PURCHASES_QUERY_PREFIX, "search"),
  });

  const normalized = normalizeSortQuery(base);
  const paymentStatus = toPaymentStatus(
    readPrefixedParam(searchParams, PARTY_PURCHASES_QUERY_PREFIX, "paymentStatus"),
  );
  const from = readPrefixedParam(searchParams, PARTY_PURCHASES_QUERY_PREFIX, "from") ?? "";
  const to = readPrefixedParam(searchParams, PARTY_PURCHASES_QUERY_PREFIX, "to") ?? "";
  const { from: normalizedFrom, to: normalizedTo } = normalizeDateRange(from, to);

  return {
    ...normalized,
    paymentStatus,
    from: normalizedFrom,
    to: normalizedTo,
  };
}

export async function getPartyPurchasesTableQuery(params: {
  partyId: string;
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<PartyPurchasesTableResult> {
  const { partyId, searchParams } = params;
  const query = toQuery(searchParams);

  const where = toWhere(partyId, query.search, query.from, query.to);
  const orderBy = toOrderBy(query);

  const purchases = await prisma.supplierPurchase.findMany({
    where,
    orderBy,
    select: {
      id: true,
      supplierFolio: true,
      occurredAt: true,
      total: true,
    },
  });

  const ids = purchases.map((purchase) => purchase.id);
  const paidGroups = ids.length
    ? await prisma.payment.groupBy({
        by: ["supplierPurchaseId"],
        where: {
          supplierPurchaseId: { in: ids },
          direction: PaymentDirection.OUT,
          ...excludeSoftDeletedPayments,
        },
        _sum: { amount: true },
      })
    : [];

  const paidByPurchaseId = mapDecimalSumsByKey(paidGroups, "supplierPurchaseId");

  const mapped: PartyPurchaseRowDto[] = purchases.map((purchase) => {
    const { isFullyPaid, paid, remaining } = computeOutstandingBalance({
      total: purchase.total,
      paid: paidByPurchaseId.get(purchase.id),
    });

    return {
      id: purchase.id,
      supplierFolio: purchase.supplierFolio,
      occurredAt: purchase.occurredAt.toISOString(),
      paymentStatus: isFullyPaid ? "PAID" : "PENDING",
      total: decimalToString(purchase.total),
      paidTotal: decimalToString(paid),
      remainingTotal: decimalToString(remaining),
      isFullyPaid,
    };
  });

  const filtered =
    query.paymentStatus === "all"
      ? mapped
      : mapped.filter((purchase) =>
          query.paymentStatus === "paid" ? purchase.isFullyPaid : !purchase.isFullyPaid,
        );

  const pageSize = clamp(query.pageSize, 5, 50);
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = clamp(query.page, 1, totalPages);
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
      ...query,
      page,
      pageSize,
    },
  };
}
