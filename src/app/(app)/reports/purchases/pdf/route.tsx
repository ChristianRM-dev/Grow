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

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);

  // The UI strips `type=purchases` from the PDF URL. We add it back for the shared parser.
  const sp = new URLSearchParams(url.searchParams);
  sp.set("type", "purchases");

  const state = parseReportsPageState(sp);
  if (!state || !isCompletePurchasesReportFilters(state)) {
    return new Response("Parámetros inválidos para reporte de compras.", {
      status: 400,
    });
  }

  const report = await getPurchasesReport(state);

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
    <PurchasesReportPdfDocument
      header={header}
      headerLogoSrc={headerLogoSrc}
      report={report}
    />
  );

  const body = new Uint8Array(pdfBuffer);

  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Reporte de Compras.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
