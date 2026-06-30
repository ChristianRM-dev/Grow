import {
  PaymentDirection,
  PartyLedgerSide,
  PartyLedgerSourceType,
  type Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  excludeSoftDeleted,
  excludeSoftDeletedPayments,
} from "@/modules/shared/queries/softDeleteHelpers";
import {
  buildPartyLedgerSummary,
  mapPartyLedgerRows,
} from "./_partyLedgerMappers";
import {
  computeOutstandingBalance,
  decimalToString,
  mapDecimalSumsByKey,
} from "@/modules/shared/utils/decimals";
import {
  type PartyPurchasePaymentStatusFilter,
  type PartyPurchaseRowDto,
} from "@/modules/parties/queries/partyPurchasesQuery";

export type PartyPdfPartyDto = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  createdAt: string; // ISO
  roles: Array<"CUSTOMER" | "SUPPLIER">;
};

export type PartyPdfLedgerRowDto = {
  id: string;
  occurredAt: string; // ISO
  side: PartyLedgerSide;
  sourceType: PartyLedgerSourceType;
  sourceId: string | null;
  reference: string;
  amount: string;
  notes: string | null;
};

export type PartyPdfSalesNoteRowDto = {
  id: string;
  createdAt: string; // ISO
  folio: string;
  paymentStatus: "PAID" | "PENDING" | "CANCELLED";
  total: string;
  paidTotal: string;
  remainingTotal: string;
  isFullyPaid: boolean;
};

export type PartyPdfPurchaseRowDto = PartyPurchaseRowDto;

export type PartyPdfSummaryDto = {
  receivableTotal: string;
  payableTotal: string;
  netTotal: string; // receivable - payable
};

type PartyPdfLedgerQuery = {
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
};

type PartyPdfSalesNotesQuery = {
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  paymentStatus?: "all" | "paid" | "pending";
  from?: string;
  to?: string;
};

type PartyPdfPurchasesQuery = {
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  paymentStatus?: PartyPurchasePaymentStatusFilter;
  from?: string;
  to?: string;
};

export type PartyPdfDataOptions = {
  includeLedger?: boolean;
  includePurchases?: boolean;
  includeSalesNotes?: boolean;
  ledgerQuery?: PartyPdfLedgerQuery;
  purchasesQuery?: PartyPdfPurchasesQuery;
  salesNotesQuery?: PartyPdfSalesNotesQuery;
};

function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function startOfDayUtc(dateOnly: string) {
  return new Date(`${dateOnly}T00:00:00.000Z`);
}

function addDaysUtc(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function toLedgerOrderBy(q: PartyPdfLedgerQuery): Prisma.PartyLedgerEntryOrderByWithRelationInput[] {
  const allowed = new Set(["occurredAt", "amount", "reference", "sourceType", "side"]);
  const sortField = allowed.has(String(q.sortField ?? "").trim())
    ? String(q.sortField).trim()
    : "occurredAt";
  const sortOrder = (q.sortOrder ?? "desc") as Prisma.SortOrder;

  return [
    {
      [sortField]: sortOrder,
    } as Prisma.PartyLedgerEntryOrderByWithRelationInput,
    { id: "desc" },
  ];
}

function toLedgerWhere(
  partyId: string,
  search?: string,
): Prisma.PartyLedgerEntryWhereInput {
  const term = String(search ?? "").trim();
  const baseWhere: Prisma.PartyLedgerEntryWhereInput = {
    partyId,
    ...excludeSoftDeleted,
  };

  if (!term) return baseWhere;

  return {
    ...baseWhere,
    OR: [
      { reference: { contains: term, mode: "insensitive" } },
      { notes: { contains: term, mode: "insensitive" } },
    ],
  };
}

function toSalesNotesOrderBy(
  q: PartyPdfSalesNotesQuery,
): Prisma.SalesNoteOrderByWithRelationInput[] {
  const allowed = new Set(["createdAt", "folio", "total"]);
  const sortField = allowed.has(String(q.sortField ?? "").trim())
    ? String(q.sortField).trim()
    : "createdAt";
  const sortOrder = (q.sortOrder ?? "desc") as Prisma.SortOrder;

  return [
    {
      [sortField]: sortOrder,
    } as Prisma.SalesNoteOrderByWithRelationInput,
    { id: "desc" },
  ];
}

function toPurchasesOrderBy(
  q: PartyPdfPurchasesQuery,
): Prisma.SupplierPurchaseOrderByWithRelationInput[] {
  const allowed = new Set(["occurredAt", "supplierFolio", "total"]);
  const sortField = allowed.has(String(q.sortField ?? "").trim())
    ? String(q.sortField).trim()
    : "occurredAt";
  const sortOrder = (q.sortOrder ?? "desc") as Prisma.SortOrder;

  return [
    {
      [sortField]: sortOrder,
    } as Prisma.SupplierPurchaseOrderByWithRelationInput,
    { id: "desc" },
  ];
}

function toSalesNotesWhere(
  partyId: string,
  query?: PartyPdfSalesNotesQuery,
): Prisma.SalesNoteWhereInput {
  const q = query ?? {};
  const term = String(q.search ?? "").trim();
  const from = String(q.from ?? "").trim();
  const to = String(q.to ?? "").trim();

  const where: Prisma.SalesNoteWhereInput = {
    partyId,
  };

  if (isDateOnly(from) || isDateOnly(to)) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (isDateOnly(from)) createdAt.gte = startOfDayUtc(from);
    if (isDateOnly(to)) createdAt.lt = addDaysUtc(startOfDayUtc(to), 1);
    where.createdAt = createdAt;
  }

  if (term) {
    where.OR = [{ folio: { contains: term, mode: "insensitive" } }];
  }

  return where;
}

function toPurchasesWhere(
  partyId: string,
  query?: PartyPdfPurchasesQuery,
): Prisma.SupplierPurchaseWhereInput {
  const q = query ?? {};
  const term = String(q.search ?? "").trim();
  const from = String(q.from ?? "").trim();
  const to = String(q.to ?? "").trim();

  const where: Prisma.SupplierPurchaseWhereInput = {
    partyId,
    isDeleted: false,
  };

  if (isDateOnly(from) || isDateOnly(to)) {
    const occurredAt: Prisma.DateTimeFilter = {};
    if (isDateOnly(from)) occurredAt.gte = startOfDayUtc(from);
    if (isDateOnly(to)) occurredAt.lt = addDaysUtc(startOfDayUtc(to), 1);
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

async function getPartySalesNotesPdfRows(params: {
  partyId: string;
  query?: PartyPdfSalesNotesQuery;
}) {
  const { partyId, query } = params;

  const where = toSalesNotesWhere(partyId, query);
  const orderBy = toSalesNotesOrderBy(query ?? {});

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
  const paymentStatus = query?.paymentStatus ?? "all";

  const mapped = notes.map((note) => {
    const { isFullyPaid, paid, remaining } = computeOutstandingBalance({
      total: note.total,
      paid: paidByNoteId.get(note.id),
    });

    const status =
      note.status === "CANCELLED"
        ? "CANCELLED"
        : isFullyPaid
          ? "PAID"
          : "PENDING";

    return {
      id: note.id,
      folio: note.folio,
      createdAt: note.createdAt.toISOString(),
      paymentStatus: status,
      total: decimalToString(note.total),
      paidTotal: decimalToString(paid),
      remainingTotal: decimalToString(remaining),
      isFullyPaid,
    } satisfies PartyPdfSalesNoteRowDto;
  });

  const filtered =
    paymentStatus === "all"
      ? mapped
      : mapped.filter((note) => {
          if (note.paymentStatus === "CANCELLED") return false;
          return paymentStatus === "paid" ? note.isFullyPaid : !note.isFullyPaid;
        });

  return filtered;
}

async function getPartyPurchasesPdfRows(params: {
  partyId: string;
  query?: PartyPdfPurchasesQuery;
}) {
  const { partyId, query } = params;

  const where = toPurchasesWhere(partyId, query);
  const orderBy = toPurchasesOrderBy(query ?? {});

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
  const paymentStatus = query?.paymentStatus ?? "all";

  const mapped = purchases.map((purchase) => {
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
    } satisfies PartyPdfPurchaseRowDto;
  });

  if (paymentStatus === "all") return mapped;

  return mapped.filter((purchase) =>
    paymentStatus === "paid" ? purchase.isFullyPaid : !purchase.isFullyPaid,
  );
}

export async function getPartyPdfDataById(
  partyId: string,
  options: PartyPdfDataOptions = {},
) {
  const party = await prisma.party.findFirst({
    where: { id: partyId, isDeleted: false },
    select: {
      id: true,
      name: true,
      phone: true,
      notes: true,
      createdAt: true,
      roles: { select: { role: true } },
    },
  });

  if (!party) return null;

  // Summary totals (same logic as details page)
  // ✅ Solo contar entradas activas
  const grouped = await prisma.partyLedgerEntry.groupBy({
    by: ["side"],
    where: {
      partyId,
      ...excludeSoftDeleted, // ← Filtrar entradas eliminadas
    },
    _sum: { amount: true },
  });

  const summary: PartyPdfSummaryDto = buildPartyLedgerSummary(grouped);

  const includeLedger = options.includeLedger ?? true;
  const includePurchases = options.includePurchases ?? true;
  const includeSalesNotes = options.includeSalesNotes ?? false;

  const [ledgerRows, purchasesRows, salesNotesRows] = await Promise.all([
    includeLedger
      ? prisma.partyLedgerEntry.findMany({
          where: toLedgerWhere(partyId, options.ledgerQuery?.search),
          orderBy: toLedgerOrderBy(options.ledgerQuery ?? {}),
          select: {
            id: true,
            occurredAt: true,
            side: true,
            sourceType: true,
            sourceId: true,
            reference: true,
            amount: true,
            notes: true,
          },
        })
      : Promise.resolve([]),
    includePurchases
      ? getPartyPurchasesPdfRows({
          partyId,
          query: options.purchasesQuery,
        })
      : Promise.resolve([]),
    includeSalesNotes
      ? getPartySalesNotesPdfRows({
          partyId,
          query: options.salesNotesQuery,
        })
      : Promise.resolve([]),
  ]);

  return {
    party: {
      id: party.id,
      name: party.name,
      phone: party.phone,
      notes: party.notes,
      createdAt: party.createdAt.toISOString(),
      roles: party.roles.map((r) => r.role),
    } satisfies PartyPdfPartyDto,
    summary,
    ledger: mapPartyLedgerRows(ledgerRows) satisfies PartyPdfLedgerRowDto[],
    purchases: purchasesRows,
    salesNotes: salesNotesRows,
  };
}
