// src/modules/reports/queries/getPurchasesReportAvailableMonths.query.ts
import { prisma } from "@/lib/prisma";

export async function getPurchasesReportAvailableMonthsQuery(
  year: number
): Promise<number[]> {
  const rows = await prisma.$queryRaw<Array<{ month: number }>>`
    SELECT DISTINCT EXTRACT(MONTH FROM "occurredAt")::int AS month
    FROM "SupplierPurchase"
    WHERE EXTRACT(YEAR FROM "occurredAt")::int = ${year}
    ORDER BY month ASC
  `;

  return rows.map((r) => r.month);
}
