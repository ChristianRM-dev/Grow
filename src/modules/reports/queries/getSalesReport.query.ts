// src/modules/reports/queries/getSalesReport.query.ts
import { prisma } from "@/lib/prisma";
import { PaymentDirection } from "@/generated/prisma/client";

import type { SalesReportFilters } from "@/modules/reports/domain/salesReportFilters.schema";
import { getReportDateRange } from "@/modules/reports/domain/reportDateRange";
import { toNumber } from "@/modules/shared/utils/toNumber";
import { parseDescriptionSnapshotName } from "@/modules/shared/snapshots/parseDescriptionSnapshotName";

import type { SalesReportDto } from "./getSalesReport.dto";

function paymentStatusLabel(status: string | undefined): string | null {
  if (!status || status === "all") return null;
  if (status === "paid") return "Pagados";
  if (status === "pending") return "Pendientes";
  return null;
}

export async function getSalesReport(
  filters: SalesReportFilters
): Promise<SalesReportDto> {
  const {
    from,
    toExclusive,
    rangeLabel: baseRangeLabel,
  } = getReportDateRange(filters);

  // Optional filters
  const status = filters.status ?? "all";
  const partyId = filters.partyId?.trim() ? filters.partyId.trim() : null;

  const where: any = {
    createdAt: { gte: from, lt: toExclusive },
  };

  if (partyId) {
    where.partyId = partyId;
  }

  const salesNotes = await prisma.salesNote.findMany({
    where,
    select: {
      id: true,
      folio: true,
      createdAt: true,
      total: true,
      party: { select: { name: true } },
      lines: {
        select: {
          descriptionSnapshot: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
        },
        orderBy: { id: "asc" },
      },
      payments: {
        where: {
          direction: PaymentDirection.IN,
          amount: { not: null },
        },
        select: { amount: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const mapped = salesNotes.map((sn) => {
    const lines = sn.lines.map((l) => ({
      description: parseDescriptionSnapshotName(l.descriptionSnapshot),
      quantity: toNumber(l.quantity),
      unitPrice: toNumber(l.unitPrice),
      lineTotal: toNumber(l.lineTotal),
    }));

    const total = toNumber(sn.total);

    const paidTotal = sn.payments.reduce((acc, p) => {
      return acc + (p.amount == null ? 0 : toNumber(p.amount));
    }, 0);

    const balanceDue = Math.max(0, total - paidTotal);

    return {
      id: sn.id,
      folio: sn.folio,
      createdAt: sn.createdAt.toISOString(),
      partyName: sn.party.name,
      lines,
      total,
      paidTotal,
      balanceDue,
    };
  });

  // Optional payment status filter
  const filtered =
    status === "all"
      ? mapped
      : mapped.filter((sn) => {
          if (status === "paid") return sn.balanceDue <= 0;
          return sn.balanceDue > 0; // pending
        });

  // Range label: base + optional descriptors
  const parts: string[] = [baseRangeLabel];

  if (partyId) {
    const partyName =
      salesNotes[0]?.party?.name ?? filters.partyName ?? "Cliente";
    parts.push(`Cliente: ${partyName}`);
  }

  const ps = paymentStatusLabel(status);
  if (ps) parts.push(`Pagos: ${ps}`);

  const rangeLabel = parts.join(" · ");

  const grandTotal = filtered.reduce((acc, s) => acc + s.total, 0);
  const grandPaidTotal = filtered.reduce((acc, s) => acc + s.paidTotal, 0);
  const grandBalanceDue = filtered.reduce((acc, s) => acc + s.balanceDue, 0);

  return {
    type: "sales",
    mode: filters.mode,
    rangeLabel,
    salesNotes: filtered,
    grandTotal,
    grandPaidTotal,
    grandBalanceDue,
  };
}
