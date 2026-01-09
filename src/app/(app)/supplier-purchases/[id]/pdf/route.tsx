// src/app/(app)/supplier-purchases/[id]/pdf/route.tsx
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { readPublicImageAsDataUri } from "@/modules/shared/pdf/readPublicImageAsDataUri";
import { LAURELES_PDF_HEADER } from "@/modules/shared/pdf/laurelesPdfHeader";

import { SupplierPurchasePdfDocument } from "@/modules/supplier-purchases/pdf/SupplierPurchasePdfDocument";
import { getSupplierPurchasePdfDataById } from "@/modules/supplier-purchases/queries/getSupplierPurchasePdfData.query";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const purchase = await getSupplierPurchasePdfDataById(id);
  if (!purchase) return new Response("Not Found", { status: 404 });

  const headerLogoSrc = await readPublicImageAsDataUri(
    LAURELES_PDF_HEADER.logoPublicPath
  );

  const pdfBuffer = await renderToBuffer(
    <SupplierPurchasePdfDocument
      header={LAURELES_PDF_HEADER}
      headerLogoSrc={headerLogoSrc}
      purchase={purchase}
    />
  );

  const body = new Uint8Array(pdfBuffer);

  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Compra - ${encodeURIComponent(
        purchase.supplierFolio
      )}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
