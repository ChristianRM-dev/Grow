import { prisma } from "@/lib/prisma";
import { PaymentDirection } from "@/generated/prisma/client";

import type { PurchasesReportFilters } from "@/modules/reports/domain/purchasesReportFilters.schema";
import { getReportDateRange } from "@/modules/reports/domain/reportDateRange";
import { toNumber } from "@/modules/shared/utils/toNumber";

import type { PurchasesReportDto } from "./getPurchasesReport.dto";

/**
 * Fetches a Purchases report from SupplierPurchase filtered by occurredAt.
 * Since SupplierPurchase has no line items yet, we expose a synthetic single line.
 * Includes payment aggregation (paidTotal) and remaining balance (balanceDue).
 */
export async function getPurchasesReport(
  filters: PurchasesReportFilters
): Promise<PurchasesReportDto> {
  const { from, toExclusive, rangeLabel } = getReportDateRange(filters);

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

      payments: {
        where: {
          direction: PaymentDirection.OUT,
          amount: { not: null },
        },
        select: {
          amount: true,
        },
      },
    },
    orderBy: { occurredAt: "asc" },
  });

  const mapped = purchases.map((p) => {
    const total = toNumber(p.total);

    const paidTotal = p.payments.reduce((acc, pay) => {
      return acc + (pay.amount == null ? 0 : toNumber(pay.amount));
    }, 0);

    const balanceDue = Math.max(0, total - paidTotal);

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
      paidTotal,
      balanceDue,
    };
  });

  const grandTotal = mapped.reduce((acc, p) => acc + p.total, 0);
  const grandPaidTotal = mapped.reduce((acc, p) => acc + p.paidTotal, 0);
  const grandBalanceDue = mapped.reduce((acc, p) => acc + p.balanceDue, 0);

  return {
    type: "purchases",
    mode: filters.mode,
    rangeLabel,
    purchases: mapped,
    grandTotal,
    grandPaidTotal,
    grandBalanceDue,
  };
}
