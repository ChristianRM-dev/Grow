import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";

import { readPublicImageAsDataUri } from "@/modules/shared/pdf/readPublicImageAsDataUri";
import { LAURELES_PDF_HEADER } from "@/modules/shared/pdf/laurelesPdfHeader";

import { getPartyPdfDataById } from "@/modules/parties/queries/getPartyPdfDataById.query";
import { PartyPdfDocument } from "@/modules/parties/pdf/PartyPdfDocument";
import { PARTY_SALES_NOTES_QUERY_KEYS } from "@/modules/parties/queries/partySalesNotesQuery";

export const runtime = "nodejs";

function sanitizeFilename(name: string) {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  function parseBool(value: string | null, defaultValue: boolean) {
    if (value === null) return defaultValue;
    return value === "1" || value === "true";
  }

  const showSalesNotes = parseBool(searchParams.get("showSalesNotes"), true);
  const showLedger = parseBool(searchParams.get("showLedger"), false);

  const salesNotesPaymentStatus = searchParams.get(
    PARTY_SALES_NOTES_QUERY_KEYS.paymentStatus,
  );
  const salesNotesStatus =
    salesNotesPaymentStatus === "paid" || salesNotesPaymentStatus === "pending"
      ? salesNotesPaymentStatus
      : undefined;

  const data = await getPartyPdfDataById(id, {
    includeLedger: showLedger,
    includeSalesNotes: showSalesNotes,
    ledgerQuery: {
      search: searchParams.get("search") ?? undefined,
      sortField: searchParams.get("sortField") ?? undefined,
      sortOrder:
        searchParams.get("sortOrder") === "asc" ||
        searchParams.get("sortOrder") === "desc"
          ? (searchParams.get("sortOrder") as "asc" | "desc")
          : undefined,
    },
    salesNotesQuery: {
      search: searchParams.get(PARTY_SALES_NOTES_QUERY_KEYS.search) ?? undefined,
      sortField:
        searchParams.get(PARTY_SALES_NOTES_QUERY_KEYS.sortField) ?? undefined,
      sortOrder:
        searchParams.get(PARTY_SALES_NOTES_QUERY_KEYS.sortOrder) === "asc" ||
        searchParams.get(PARTY_SALES_NOTES_QUERY_KEYS.sortOrder) === "desc"
          ? (searchParams.get(PARTY_SALES_NOTES_QUERY_KEYS.sortOrder) as
              | "asc"
              | "desc")
          : undefined,
      paymentStatus: salesNotesStatus,
      from: searchParams.get(PARTY_SALES_NOTES_QUERY_KEYS.from) ?? undefined,
      to: searchParams.get(PARTY_SALES_NOTES_QUERY_KEYS.to) ?? undefined,
    },
  });
  if (!data) return new Response("Not Found", { status: 404 });

  const headerLogoSrc = await readPublicImageAsDataUri(
    LAURELES_PDF_HEADER.logoPublicPath
  );

  const pdfBuffer = await renderToBuffer(
    <PartyPdfDocument
      party={data.party}
      summary={data.summary}
      ledger={data.ledger}
      salesNotes={data.salesNotes}
      showLedger={showLedger}
      showSalesNotes={showSalesNotes}
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
