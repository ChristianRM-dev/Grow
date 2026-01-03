import { prisma } from "@/lib/prisma";

/**
 * Returns distinct years for which at least one SalesNote exists.
 * Derived exclusively from SalesNote.createdAt.
 */
export async function getSalesNoteAvailableYears(): Promise<number[]> {
  const rows = await prisma.salesNote.findMany({
    select: { createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const years = new Set<number>();
  for (const r of rows) {
    years.add(r.createdAt.getFullYear());
  }

  return Array.from(years).sort((a, b) => b - a);
}
