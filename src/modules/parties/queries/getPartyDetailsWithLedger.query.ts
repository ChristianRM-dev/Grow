import { prisma } from "@/lib/prisma";
import {
  Prisma,
  PartyLedgerSide,
  PartyLedgerSourceType,
} from "@/generated/prisma/client";
import { parseTableSearchParams } from "@/modules/shared/tables/parseTableSearchParams";

export type PartyDetailsDto = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  createdAt: string; // ISO
  roles: Array<"CUSTOMER" | "SUPPLIER">;
};

export type PartyLedgerRowDto = {
  id: string;
  occurredAt: string; // ISO
  side: PartyLedgerSide;
  sourceType: PartyLedgerSourceType;
  sourceId: string | null;
  reference: string;
  amount: string;
  notes: string | null;
};

export type PartyLedgerSummaryDto = {
  receivableTotal: string;
  payableTotal: string;
  netTotal: string; // receivable - payable
};

const allowedSortFields = new Set([
  "occurredAt",
  "amount",
  "reference",
  "sourceType",
  "side",
]);

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toOrderBy(q: {
  sortField?: string;
  sortOrder?: "asc" | "desc";
}): Prisma.PartyLedgerEntryOrderByWithRelationInput[] {
  const rawField = String(q.sortField ?? "occurredAt").trim();
  const field = allowedSortFields.has(rawField) ? rawField : "occurredAt";
  const order = (q.sortOrder ?? "desc") as Prisma.SortOrder;

  return [
    { [field]: order } as Prisma.PartyLedgerEntryOrderByWithRelationInput,
  ];
}

function toWhere(
  partyId: string,
  search?: string
): Prisma.PartyLedgerEntryWhereInput {
  const term = String(search ?? "").trim();
  if (!term) return { partyId };

  return {
    partyId,
    OR: [
      { reference: { contains: term, mode: "insensitive" } },
      { notes: { contains: term, mode: "insensitive" } },
    ],
  };
}

function toDecimalString(d: Prisma.Decimal | null | undefined) {
  return (d ?? new Prisma.Decimal(0)).toString();
}

export async function getPartyDetailsWithLedgerQuery(params: {
  partyId: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { partyId, searchParams } = params;

  const q = parseTableSearchParams(searchParams);

  // Keep consistent limits with other tables (min 5, max 50)
  const pageSize = clamp(q.pageSize, 5, 50);
  const page = Math.max(1, q.page);

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

  // Summary totals
  const grouped = await prisma.partyLedgerEntry.groupBy({
    by: ["side"],
    where: { partyId },
    _sum: { amount: true },
  });

  const receivable =
    grouped.find((g) => g.side === PartyLedgerSide.RECEIVABLE)?._sum.amount ??
    null;
  const payable =
    grouped.find((g) => g.side === PartyLedgerSide.PAYABLE)?._sum.amount ??
    null;

  const receivableDec = (receivable ?? new Prisma.Decimal(0)) as Prisma.Decimal;
  const payableDec = (payable ?? new Prisma.Decimal(0)) as Prisma.Decimal;
  const netDec = receivableDec.sub(payableDec);

  const summary: PartyLedgerSummaryDto = {
    receivableTotal: toDecimalString(receivableDec),
    payableTotal: toDecimalString(payableDec),
    netTotal: toDecimalString(netDec),
  };

  const where = toWhere(partyId, q.search);
  const orderBy = toOrderBy({ sortField: q.sortField, sortOrder: q.sortOrder });

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const [totalItems, rows] = await Promise.all([
    prisma.partyLedgerEntry.count({ where }),
    prisma.partyLedgerEntry.findMany({
      where,
      orderBy,
      skip,
      take,
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
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    party: {
      id: party.id,
      name: party.name,
      phone: party.phone,
      notes: party.notes,
      createdAt: party.createdAt.toISOString(),
      roles: party.roles.map((r) => r.role),
    } satisfies PartyDetailsDto,
    summary,
    ledger: {
      data: rows.map((r) => ({
        id: r.id,
        occurredAt: r.occurredAt.toISOString(),
        side: r.side,
        sourceType: r.sourceType,
        sourceId: r.sourceId,
        reference: r.reference,
        amount: r.amount.toString(),
        notes: r.notes,
      })) satisfies PartyLedgerRowDto[],
      pagination: {
        page,
        pageSize,
        totalPages,
        totalItems,
      },
    },
  };
}
