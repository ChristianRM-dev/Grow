// src/modules/reports/queries/getPurchasesReport.query.ts
import { prisma } from "@/lib/prisma";

import type { PurchasesReportFilters } from "@/modules/reports/domain/purchasesReportFilters.schema";
import { toNumber } from "@/modules/shared/utils/toNumber";

import type { PurchasesReportDto } from "./getPurchasesReport.dto";

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
 * Fetches a Purchases report from SupplierPurchase filtered by occurredAt.
 * Since SupplierPurchase has no line items yet, we expose a synthetic single line.
 */
export async function getPurchasesReport(
  filters: PurchasesReportFilters
): Promise<PurchasesReportDto> {
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

  const purchases = await prisma.supplierPurchase.findMany({
    where: {
      occurredAt: { gte: from, lt: toExclusive },
    },
    select: {
      id: true,
      supplierFolio: true,
      occurredAt: true,
      total: true,
      notes: true,
      party: { select: { name: true } },
    },
    orderBy: { occurredAt: "asc" },
  });

  const mapped = purchases.map((p) => {
    const total = toNumber(p.total);

    // Synthetic single row (until a SupplierPurchaseLine model exists)
    const lines = [
      {
        description: "Compra a proveedor",
        quantity: 1,
        unitPrice: total,
        lineTotal: total,
      },
    ];

    return {
      id: p.id,
      supplierFolio: p.supplierFolio,
      occurredAt: p.occurredAt.toISOString(),
      partyName: p.party.name,
      notes: p.notes ?? null,
      lines,
      total,
    };
  });

  const grandTotal = mapped.reduce((acc, p) => acc + p.total, 0);

  return {
    type: "purchases",
    mode: filters.mode,
    rangeLabel,
    purchases: mapped,
    grandTotal,
  };
}
