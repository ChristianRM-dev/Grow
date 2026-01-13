import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";

import { readPublicImageAsDataUri } from "@/modules/shared/pdf/readPublicImageAsDataUri";
import { LAURELES_PDF_HEADER } from "@/modules/shared/pdf/laurelesPdfHeader";

import { getPartyPdfDataById } from "@/modules/parties/queries/getPartyPdfDataById.query";
import { PartyPdfDocument } from "@/modules/parties/pdf/PartyPdfDocument";

export const runtime = "nodejs";

function sanitizeFilename(name: string) {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const data = await getPartyPdfDataById(id);
  if (!data) return new Response("Not Found", { status: 404 });

  const headerLogoSrc = await readPublicImageAsDataUri(
    LAURELES_PDF_HEADER.logoPublicPath
  );

  const pdfBuffer = await renderToBuffer(
    <PartyPdfDocument
      party={data.party}
      summary={data.summary}
      ledger={data.ledger}
      header={LAURELES_PDF_HEADER}
      headerLogoSrc={headerLogoSrc}
    />
  );

  const body = new Uint8Array(pdfBuffer);
  const safeName = sanitizeFilename(data.party.name);
  const filename = `Estado de cuenta - ${safeName || "Contacto"}.pdf`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
