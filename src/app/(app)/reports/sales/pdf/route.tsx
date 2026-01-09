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

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);

  // The UI strips `type=sales` from the PDF URL. We add it back for the shared parser.
  const sp = new URLSearchParams(url.searchParams);
  sp.set("type", "sales");

  const state = parseReportsPageState(sp);
  if (!state || !isCompleteSalesReportFilters(state)) {
    return new Response("Parámetros inválidos para reporte de ventas.", {
      status: 400,
    });
  }

  const report = await getSalesReport(state);

  const header = {
    logoPublicPath: "/brand/laureles-logo.jpeg",
    nurseryName: "VIVERO LOS LAURELES",
    rfc: "R.F.C. VLA170116GW9",
    addressLines: [
      "Km. 3.5 carretera Coquimatlán - Pueblo Juarez S/N",
      "Col. La esperanza, Coquimatlán, Colima, C.p. 28400",
    ],
    phone: "Tel: 3·312 163 3433",
    email: "e-mail: viveroadmon@gmail.com",
    issuedPlaceLine1: "EXPEDIDO EN",
    issuedPlaceLine2: "COQUIMATLÁN, COL.",
  };

  const headerLogoSrc = await readPublicImageAsDataUri(header.logoPublicPath);

  const pdfBuffer = await renderToBuffer(
    <SalesReportPdfDocument
      header={header}
      headerLogoSrc={headerLogoSrc}
      report={report}
    />
  );

  const body = new Uint8Array(pdfBuffer);

  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Reporte de Ventas.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
