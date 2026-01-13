import { prisma } from "@/lib/prisma";
import {
  Prisma,
  PartyLedgerSide,
  PartyLedgerSourceType,
} from "@/generated/prisma/client";

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

export type PartyPdfSummaryDto = {
  receivableTotal: string;
  payableTotal: string;
  netTotal: string; // receivable - payable
};

function toDecimalString(d: Prisma.Decimal | null | undefined) {
  return (d ?? new Prisma.Decimal(0)).toString();
}

export async function getPartyPdfDataById(partyId: string) {
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

  const summary: PartyPdfSummaryDto = {
    receivableTotal: toDecimalString(receivableDec),
    payableTotal: toDecimalString(payableDec),
    netTotal: toDecimalString(netDec),
  };

  // Full ledger (no pagination)
  const rows = await prisma.partyLedgerEntry.findMany({
    where: { partyId },
    orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
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
  });

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
    ledger: rows.map((r) => ({
      id: r.id,
      occurredAt: r.occurredAt.toISOString(),
      side: r.side,
      sourceType: r.sourceType,
      sourceId: r.sourceId,
      reference: r.reference,
      amount: r.amount.toString(),
      notes: r.notes,
    })) satisfies PartyPdfLedgerRowDto[],
  };
}
