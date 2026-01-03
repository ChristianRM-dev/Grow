import { prisma } from "@/lib/prisma";
import { toNumber } from "@/modules/shared/utils/toNumber";
import { z } from "zod";

const InputSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export type MonthlySalesPointDto = {
  day: number; // 1..31
  total: number;
  count: number;
};

export type DashboardMonthlySalesDto = {
  year: number;
  month: number;
  monthTotal: number;
  monthCount: number;
  series: MonthlySalesPointDto[];
};

function getUtcMonthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  return { start, end };
}

export async function getDashboardMonthlySales(input: {
  year: number;
  month: number;
}): Promise<DashboardMonthlySalesDto> {
  const { year, month } = InputSchema.parse(input);
  const { start, end } = getUtcMonthRange(year, month);

  const notes = await prisma.salesNote.findMany({
    where: {
      createdAt: { gte: start, lt: end },
    },
    select: {
      createdAt: true,
      total: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const byDay = new Map<number, { total: number; count: number }>();

  for (const n of notes) {
    const day = n.createdAt.getUTCDate();
    const prev = byDay.get(day) ?? { total: 0, count: 0 };
    byDay.set(day, {
      total: prev.total + toNumber(n.total),
      count: prev.count + 1,
    });
  }

  const series = Array.from(byDay.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([day, v]) => ({ day, total: v.total, count: v.count }));

  const monthTotal = series.reduce((acc, x) => acc + x.total, 0);
  const monthCount = series.reduce((acc, x) => acc + x.count, 0);

  return { year, month, monthTotal, monthCount, series };
}
