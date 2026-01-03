import { prisma } from "@/lib/prisma";

export async function getSalesReportAvailableMonthsQuery(
  year: number
): Promise<number[]> {
  const rows = await prisma.$queryRaw<Array<{ month: number }>>`
    SELECT DISTINCT EXTRACT(MONTH FROM "createdAt")::int AS month
    FROM "SalesNote"
    WHERE EXTRACT(YEAR FROM "createdAt")::int = ${year}
    ORDER BY month ASC
  `;

  return rows.map((r) => r.month);
}
