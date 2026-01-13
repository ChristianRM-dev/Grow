// src/app/(app)/reports/purchases/pdf/route.tsx
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { readPublicImageAsDataUri } from "@/modules/shared/pdf/readPublicImageAsDataUri";

import {
  parseReportsPageState,
  isCompletePurchasesReportFilters,
} from "@/modules/reports/domain/reportSearchParams";
import { getPurchasesReport } from "@/modules/reports/queries/getPurchasesReport.query";

import { PurchasesReportPdfDocument } from "@/modules/reports/pdf/PurchasesReportPdfDocument";
import { LAURELES_PDF_HEADER } from "@/modules/shared/pdf/laurelesPdfHeader";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);

  // UI strips `type=purchases` from PDF URL. Add it back for the shared parser.
  const sp = new URLSearchParams(url.searchParams);
  sp.set("type", "purchases");

  const state = parseReportsPageState(sp);

  if (!state || !isCompletePurchasesReportFilters(state)) {
    return new Response("Parámetros inválidos para reporte de compras.", {
      status: 400,
    });
  }

  const report = await getPurchasesReport(state);

  const headerLogoSrc = await readPublicImageAsDataUri(
    LAURELES_PDF_HEADER.logoPublicPath
  );

  const pdfBuffer = await renderToBuffer(
    <PurchasesReportPdfDocument
      header={LAURELES_PDF_HEADER}
      headerLogoSrc={headerLogoSrc}
      report={report}
    />
  );

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Reporte de Compras.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
