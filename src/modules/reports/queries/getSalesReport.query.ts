import { prisma } from "@/lib/prisma";

import type { SalesReportFilters } from "@/modules/reports/domain/salesReportFilters.schema";
import { toNumber } from "@/modules/shared/utils/toNumber";
import { parseDescriptionSnapshotName } from "@/modules/shared/snapshots/parseDescriptionSnapshotName";

import type { SalesReportDto } from "./getSalesReport.dto";

const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

function startOfMonthUtc(year: number, month1to12: number) {
  return new Date(Date.UTC(year, month1to12 - 1, 1, 0, 0, 0, 0));
}

function startOfNextMonthUtc(year: number, month1to12: number) {
  if (month1to12 === 12) return new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
  return new Date(Date.UTC(year, month1to12, 1, 0, 0, 0, 0));
}

function startOfYearUtc(year: number) {
  return new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
}

function startOfNextYearUtc(year: number) {
  return new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
}

function parseDateOnlyToUtcStart(dateOnly: string) {
  // dateOnly must be YYYY-MM-DD (validated by Zod upstream)
  return new Date(`${dateOnly}T00:00:00.000Z`);
}

function addDaysUtc(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Fetches a Sales report from SalesNote + SalesNoteLine, filtered by createdAt.
 * NOTE: Adjust status filtering if you want to include DRAFT/CANCELLED.
 */
export async function getSalesReport(
  filters: SalesReportFilters
): Promise<SalesReportDto> {
  let from: Date;
  let toExclusive: Date;
  let rangeLabel = "";

  if (filters.mode === "yearMonth") {
    const year = filters.year;
    const month = filters.month;

    if (typeof month === "number") {
      from = startOfMonthUtc(year, month);
      toExclusive = startOfNextMonthUtc(year, month);
      rangeLabel = `${MONTHS_ES[month - 1]} ${year}`;
    } else {
      from = startOfYearUtc(year);
      toExclusive = startOfNextYearUtc(year);
      rangeLabel = `Año ${year}`;
    }
  } else {
    const fromDate = parseDateOnlyToUtcStart(filters.from);
    const toDate = parseDateOnlyToUtcStart(filters.to);
    from = fromDate;
    toExclusive = addDaysUtc(toDate, 1); // inclusive "to"
    rangeLabel = `${filters.from} → ${filters.to}`;
  }

  const salesNotes = await prisma.salesNote.findMany({
    where: {
      createdAt: { gte: from, lt: toExclusive },
      // Recommended for real "sales" reporting:
      status: "CONFIRMED",
      // If you prefer: status: { not: "CANCELLED" }
    },
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

    return {
      id: sn.id,
      folio: sn.folio,
      createdAt: sn.createdAt.toISOString(),
      partyName: sn.party.name,
      lines,
      total: toNumber(sn.total),
    };
  });

  const grandTotal = mapped.reduce((acc, s) => acc + s.total, 0);

  return {
    type: "sales",
    mode: filters.mode,
    rangeLabel,
    salesNotes: mapped,
    grandTotal,
  };
}
