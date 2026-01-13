// src/app/(app)/reports/sales/pdf/route.ts
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { readPublicImageAsDataUri } from "@/modules/shared/pdf/readPublicImageAsDataUri";

import {
  parseReportsPageState,
  isCompleteSalesReportFilters,
} from "@/modules/reports/domain/reportSearchParams";
import { getSalesReport } from "@/modules/reports/queries/getSalesReport.query";

import { SalesReportPdfDocument } from "@/modules/reports/pdf/SalesReportPdfDocument";
import { LAURELES_PDF_HEADER } from "@/modules/shared/pdf/laurelesPdfHeader";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);

  // The UI strips `type=sales` from the PDF URL. We add it back for the shared parser.
  const sp = new URLSearchParams(url.searchParams);
  sp.set("type", "sales");

  const state = parseReportsPageState(sp);

  // IMPORTANT: for PDF we require a COMPLETE filter set
  if (!isCompleteSalesReportFilters(state)) {
    return new Response("Parámetros inválidos para reporte de ventas.", {
      status: 400,
    });
  }

  const report = await getSalesReport(state);

  const headerLogoSrc = await readPublicImageAsDataUri(
    LAURELES_PDF_HEADER.logoPublicPath
  );

  const pdfBuffer = await renderToBuffer(
    <SalesReportPdfDocument
      header={LAURELES_PDF_HEADER}
      headerLogoSrc={headerLogoSrc}
      report={report}
    />
  );

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Reporte de Ventas.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
