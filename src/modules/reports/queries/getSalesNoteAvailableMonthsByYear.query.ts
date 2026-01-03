import { prisma } from "@/lib/prisma";

function startOfYearUtc(year: number) {
  return new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
}

function startOfNextYearUtc(year: number) {
  return new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
}

/**
 * Returns distinct months (1-12) for which at least one SalesNote exists in the given year.
 * Derived exclusively from SalesNote.createdAt.
 */
export async function getSalesNoteAvailableMonthsByYear(
  year: number
): Promise<number[]> {
  const from = startOfYearUtc(year);
  const to = startOfNextYearUtc(year);

  const rows = await prisma.salesNote.findMany({
    where: {
      createdAt: {
        gte: from,
        lt: to,
      },
    },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const months = new Set<number>();
  for (const r of rows) {
    months.add(r.createdAt.getUTCMonth() + 1);
  }

  return Array.from(months).sort((a, b) => a - b);
}
