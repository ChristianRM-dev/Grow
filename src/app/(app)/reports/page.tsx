import { auth } from "@/auth";
import { redirect } from "next/navigation";

import {
  parseReportsPageState,
  serializeReportsPageState,
} from "@/modules/reports/domain/reportSearchParams";
import { ReportsPageClient } from "@/modules/reports/components/ReportsPageClient";
import { ReportTypeEnum } from "@/modules/reports/domain/reportTypes";

import { getSalesReport } from "@/modules/reports/queries/getSalesReport.query";
import { SalesReportResult } from "@/modules/reports/components/SalesReportResult";

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

  let pdfHref: string | null = null;

  if (state && state.type === ReportTypeEnum.SALES && "mode" in state) {
    salesReport = await getSalesReport(state);

    const pdfParams = serializeReportsPageState(state).toString();
    pdfHref = pdfParams
      ? `/reports/sales/pdf?${pdfParams.replace(/^type=sales&?/, "")}`
      : "/reports/sales/pdf";
    // NOTE: Our PDF route expects only mode/year/month/from/to. We strip type=sales.
  }

  return (
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
    </div>
  );
}
