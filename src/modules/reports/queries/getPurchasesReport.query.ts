import { prisma } from "@/lib/prisma";
import { PaymentDirection } from "@/generated/prisma/client"
import type { PurchasesReportFilters } from "@/modules/reports/domain/purchasesReportFilters.schema";
import { getReportDateRange } from "@/modules/reports/domain/reportDateRange";
import { toNumber } from "@/modules/shared/utils/toNumber";
import {
  excludeSoftDeleted,
  excludeSoftDeletedPayments,
} from "@/modules/shared/queries/softDeleteHelpers"
import type { PurchasesReportDto } from "./getPurchasesReport.dto";

function paymentStatusLabel(status: string | undefined): string | null {
  if (!status || status === "all") return null;
  if (status === "paid") return "Pagadas";
  if (status === "pending") return "Pendientes";
  return null;
}

export async function getPurchasesReport(
  filters: PurchasesReportFilters
): Promise<PurchasesReportDto> {
  const {
    from,
    toExclusive,
    rangeLabel: baseRangeLabel,
  } = getReportDateRange(filters)

  const status = filters.status ?? "all"

  // ✅ Usar partyIds (array) en lugar de partyId (string)
  const partyIds =
    filters.partyIds && filters.partyIds.length > 0 ? filters.partyIds : null
  const partyFilterMode = filters.partyFilterMode

  const where: any = {
    occurredAt: { gte: from, lt: toExclusive },
    ...excludeSoftDeleted,
  }

  // ✅ Manejar filtro de múltiples parties con include/exclude
  if (partyIds && partyFilterMode) {
    if (partyFilterMode === "include") {
      where.partyId = { in: partyIds }
    } else {
      // exclude
      where.partyId = { notIn: partyIds }
    }
  }

  const purchases = await prisma.supplierPurchase.findMany({
    where,
    select: {
      id: true,
      supplierFolio: true,
      occurredAt: true,
      total: true,
      notes: true,
      party: { select: { id: true, name: true } },
      payments: {
        where: {
          direction: PaymentDirection.OUT,
          amount: { not: null },
          ...excludeSoftDeletedPayments,
        },
        select: { amount: true },
      },
    },
    orderBy: { occurredAt: "asc" },
  })

  const mapped = purchases.map((p) => {
    const total = toNumber(p.total)
    const paidTotal = p.payments.reduce((acc, pay) => {
      return acc + (pay.amount == null ? 0 : toNumber(pay.amount))
    }, 0)
    const balanceDue = Math.max(0, total - paidTotal)

    const lines = [
      {
        description: "Compra a proveedor",
        quantity: 1,
        unitPrice: total,
        lineTotal: total,
      },
    ]

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
    }
  })

  const filtered =
    status === "all"
      ? mapped
      : mapped.filter((x) => {
          if (status === "paid") return x.balanceDue <= 0
          return x.balanceDue > 0 // pending
        })

  // ✅ Construir rangeLabel con múltiples parties
  const parts: string[] = [baseRangeLabel]

  if (partyIds && partyFilterMode) {
    const uniqueParties = new Set(purchases.map((p) => p.party.name))
    const partyCount = partyIds.length

    if (partyFilterMode === "include") {
      if (partyCount === 1) {
        const name = purchases[0]?.party?.name ?? "Proveedor"
        parts.push(`Proveedor: ${name}`)
      } else {
        parts.push(`${partyCount} proveedores seleccionados`)
      }
    } else {
      parts.push(`Excluidos: ${partyCount} proveedores`)
    }
  }

  const ps = paymentStatusLabel(status)
  if (ps) parts.push(`Estado: ${ps}`)

  const rangeLabel = parts.join(" · ")

  const grandTotal = filtered.reduce((acc, p) => acc + p.total, 0)
  const grandPaidTotal = filtered.reduce((acc, p) => acc + p.paidTotal, 0)
  const grandBalanceDue = filtered.reduce((acc, p) => acc + p.balanceDue, 0)

  return {
    type: "purchases",
    mode: filters.mode,
    rangeLabel,
    purchases: filtered,
    grandTotal,
    grandPaidTotal,
    grandBalanceDue,
  }
}
