import { MonthlySalesChartCardClient } from "@/modules/dashboard/components/MonthlySalesChartCardClient";
import { ReceivablesAgingCardClient } from "@/modules/dashboard/components/ReceivablesAgingCardClient";
import { TopDelinquentCustomersCard } from "@/modules/dashboard/components/TopDelinquentCustomersCard";
import { getDashboardMonthlySales } from "@/modules/dashboard/queries/getDashboardMonthlySales.query";
import { getDashboardReceivablesSummary } from "@/modules/dashboard/queries/getDashboardReceivablesSummary.query";
import { getDashboardTopDelinquentCustomers } from "@/modules/dashboard/queries/getDashboardTopDelinquentCustomers.query";

type DashboardPageProps = {
  searchParams?: { year?: string; month?: string };
};

function parseYearMonth(searchParams?: DashboardPageProps["searchParams"]) {
  const now = new Date();
  const defaultYear = now.getUTCFullYear();
  const defaultMonth = now.getUTCMonth() + 1;

  const yearRaw = searchParams?.year ? Number(searchParams.year) : defaultYear;
  const monthRaw = searchParams?.month
    ? Number(searchParams.month)
    : defaultMonth;

  const year =
    Number.isFinite(yearRaw) && yearRaw >= 2000 && yearRaw <= 2100
      ? yearRaw
      : defaultYear;
  const month =
    Number.isFinite(monthRaw) && monthRaw >= 1 && monthRaw <= 12
      ? monthRaw
      : defaultMonth;

  return { year, month };
}



export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
    const sp = await searchParams;
    const { year, month } = parseYearMonth(sp);
  const asOf = new Date();

  const [monthlySales, receivables, topDelinquents] = await Promise.all([
    getDashboardMonthlySales({ year, month }),
    getDashboardReceivablesSummary({ asOf }),
    getDashboardTopDelinquentCustomers(),
  ]);

  return (
    <div className="relative w-full p-4">
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm opacity-70">Resumen operativo</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MonthlySalesChartCardClient data={monthlySales} />
          <ReceivablesAgingCardClient data={receivables} />
          <TopDelinquentCustomersCard data={topDelinquents} />
        </div>
      </div>
    </div>
  );
}
