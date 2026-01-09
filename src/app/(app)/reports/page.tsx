// src/app/(app)/reports/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import {
  isCompleteSalesReportFilters,
  isCompletePurchasesReportFilters,
  parseReportsPageState,
  serializeReportsPageState,
} from "@/modules/reports/domain/reportSearchParams";

import { ReportsPageClient } from "@/modules/reports/components/ReportsPageClient";

import { getSalesReport } from "@/modules/reports/queries/getSalesReport.query";
import { getPurchasesReport } from "@/modules/reports/queries/getPurchasesReport.query";

import { SalesReportResult } from "@/modules/reports/components/SalesReportResult";
import { PurchasesReportResult } from "@/modules/reports/components/PurchasesReportResult";

import { routes } from "@/lib/routes";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const sp = await searchParams;
  const urlSearchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(sp)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        if (typeof v === "string") urlSearchParams.append(key, v);
      }
    } else if (typeof value === "string") {
      urlSearchParams.set(key, value);
    }
  }

  const state = parseReportsPageState(urlSearchParams);
  const hasInvalidParams = state === null;

  // If filters are valid and complete, fetch report server-side.
  let salesReport: Awaited<ReturnType<typeof getSalesReport>> | null = null;
  let purchasesReport: Awaited<ReturnType<typeof getPurchasesReport>> | null =
    null;

  let pdfHref: string | null = null;

  if (isCompleteSalesReportFilters(state)) {
    salesReport = await getSalesReport(state);

    const pdfParams = serializeReportsPageState(state);
    pdfParams.delete("type"); // keep your existing behavior

    const qs = pdfParams.toString();
    pdfHref = routes.reports.sales.pdf(qs);
  } else if (isCompletePurchasesReportFilters(state)) {
    purchasesReport = await getPurchasesReport(state);

    const pdfParams = serializeReportsPageState(state);
    pdfParams.delete("type"); // keep your existing behavior

    const qs = pdfParams.toString();
    pdfHref = routes.reports.purchases.pdf(qs);
  }

  return (
    <div className="relative w-full p-4">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Reportes</h1>
          <p className="text-sm opacity-70">
            Selecciona un tipo de reporte y define el período.
          </p>
        </div>

        <ReportsPageClient
          initialState={state ?? { type: undefined }}
          hasInvalidParams={hasInvalidParams}
        />

        {salesReport && pdfHref ? (
          <SalesReportResult report={salesReport} pdfHref={pdfHref} />
        ) : null}

        {purchasesReport && pdfHref ? (
          <PurchasesReportResult report={purchasesReport} pdfHref={pdfHref} />
        ) : null}
      </div>
    </div>
  );
}
