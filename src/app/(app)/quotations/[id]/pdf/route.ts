// src/app/(app)/quotations/[id]/pdf/route.ts
import { NextResponse } from "next/server";
import { Readable } from "node:stream";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateQuotationPdf } from "@/modules/quotations/application/generateQuotationPdf.usecase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { doc, fileName } = await generateQuotationPdf(prisma, id);

    // PDFKit doc is a Node Readable stream
    const webStream = Readable.toWeb(doc as any);

    return new NextResponse(webStream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    console.error("[QuotationPdfRoute] error", {
      name: e?.name,
      message: e?.message,
      code: e?.code,
      meta: e?.meta,
      stack: e?.stack,
    });

    if (e?.code === "NOT_FOUND") {
      return NextResponse.json({ message: "No encontrado" }, { status: 404 });
    }
    if (e?.code === "INVALID_ID") {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    return NextResponse.json(
      {
        message: "Error generando PDF",
        error: { name: e?.name, message: e?.message },
      },
      { status: 500 }
    );
  }
}
