// src/modules/reports/queries/getPurchasesReportAvailableYears.query.ts
import { prisma } from "@/lib/prisma";

export async function getPurchasesReportAvailableYearsQuery(): Promise<
  number[]
> {
  const rows = await prisma.$queryRaw<Array<{ year: number }>>`
    SELECT DISTINCT EXTRACT(YEAR FROM "occurredAt")::int AS year
    FROM "SupplierPurchase"
    ORDER BY year ASC
  `;

  return rows.map((r) => r.year);
}
