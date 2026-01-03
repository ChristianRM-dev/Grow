import { prisma } from "@/lib/prisma";

export async function getSalesReportAvailableYearsQuery(): Promise<number[]> {
  // Prisma can't "distinct by year(createdAt)" easily, so we use a small raw query.
  const rows = await prisma.$queryRaw<Array<{ year: number }>>`
    SELECT DISTINCT EXTRACT(YEAR FROM "createdAt")::int AS year
    FROM "SalesNote"
    ORDER BY year ASC
  `;

  return rows.map((r) => r.year);
}
