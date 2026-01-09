// src/app/sales-notes/[id]/pdf/route.ts
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { SalesNotePdfDocument } from "@/modules/sales-notes/pdf/SalesNotePdfDocument";
import { readPublicImageAsDataUri } from "@/modules/shared/pdf/readPublicImageAsDataUri";
import { getSalesNotePdfDataById } from "@/modules/sales-notes/queries/getSalesNotePdfData.query";
import { numberToSpanishMoneyWords } from "@/modules/shared/money/numberToSpanishMoneyWords";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const salesNote = await getSalesNotePdfDataById(id);
  if (!salesNote) return new Response("Not Found", { status: 404 });

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
  const totalInWords = numberToSpanishMoneyWords(salesNote.total);

  // const element = React.createElement(SalesNotePdfDocument, {
  //   salesNote,
  //   header,
  //   headerLogoSrc,
  //   totalInWords,
  // });

  // const pdfBuffer = await renderToBuffer(element);

  // return new Response(pdfBuffer, {
  //   headers: {
  //     "Content-Type": "application/pdf",
  //     "Content-Disposition": `inline; filename="Nota de Venta - ${encodeURIComponent(
  //       salesNote.folio
  //     )}.pdf"`,
  //     "Cache-Control": "no-store",
  //   },
  // });

  const pdfBuffer = await renderToBuffer(
    <SalesNotePdfDocument
      salesNote={salesNote}
      header={header}
      headerLogoSrc={headerLogoSrc}
      totalInWords={totalInWords}
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
