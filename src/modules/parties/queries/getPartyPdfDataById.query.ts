import { prisma } from "@/lib/prisma";
import {
  PartyLedgerSide,
  PartyLedgerSourceType,
} from "@/generated/prisma/client";
import { excludeSoftDeleted } from "@/modules/shared/queries/softDeleteHelpers";
import {
  buildPartyLedgerSummary,
  mapPartyLedgerRows,
} from "./_partyLedgerMappers";

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

  // Full ledger (no pagination)
  // ✅ Solo mostrar entradas activas en el PDF
  const rows = await prisma.partyLedgerEntry.findMany({
    where: {
      partyId,
      ...excludeSoftDeleted, // ← Filtrar entradas eliminadas
    },
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
    ledger: mapPartyLedgerRows(rows) satisfies PartyPdfLedgerRowDto[],
  };
}
