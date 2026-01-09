// src/app/sales-notes/[id]/pdf/route.ts
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { SalesNotePdfDocument } from "@/modules/sales-notes/pdf/SalesNotePdfDocument";
import { readPublicImageAsDataUri } from "@/modules/shared/pdf/readPublicImageAsDataUri";
import { getSalesNotePdfDataById } from "@/modules/sales-notes/queries/getSalesNotePdfData.query";
import { numberToSpanishMoneyWords } from "@/modules/shared/money/numberToSpanishMoneyWords";
import { LAURELES_PDF_HEADER } from "@/modules/shared/pdf/laurelesPdfHeader";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const salesNote = await getSalesNotePdfDataById(id);
  if (!salesNote) return new Response("Not Found", { status: 404 });

  const headerLogoSrc = await readPublicImageAsDataUri(
    LAURELES_PDF_HEADER.logoPublicPath
  );
  const totalInWords = numberToSpanishMoneyWords(salesNote.total);

  const pdfBuffer = await renderToBuffer(
    <SalesNotePdfDocument
      salesNote={salesNote}
      header={LAURELES_PDF_HEADER}
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
