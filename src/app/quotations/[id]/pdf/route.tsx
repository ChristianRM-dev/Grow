// src/app/quotations/[id]/pdf/route.ts
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { readPublicImageAsDataUri } from "@/modules/shared/pdf/readPublicImageAsDataUri";
import { QuotationPdfDocument } from "@/modules/quotations/pdf/QuotationPdfDocument";
import { getQuotationPdfDataById } from "@/modules/quotations/queries/getQuotationPdfData.query";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const quotation = await getQuotationPdfDataById(id);
  if (!quotation) return new Response("Not Found", { status: 404 });

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

  // const element = React.createElement(QuotationPdfDocument, {
  //   header,
  //   headerLogoSrc,
  //   quotation,
  // });

  // const pdfBuffer = await renderToBuffer(element);

  // return new Response(pdfBuffer, {
  //   headers: {
  //     "Content-Type": "application/pdf",
  //     "Content-Disposition": `inline; filename="Cotizacion - ${encodeURIComponent(
  //       quotation.folio
  //     )}.pdf"`,
  //     "Cache-Control": "no-store",
  //   },
  // });


    const pdfBuffer = await renderToBuffer(
      <QuotationPdfDocument
        header={header}
        headerLogoSrc={headerLogoSrc}
        quotation={quotation}
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
