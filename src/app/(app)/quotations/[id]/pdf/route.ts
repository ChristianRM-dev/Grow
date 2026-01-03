import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { pdfKitToReadableStream } from "@/modules/shared/pdf/pdfStream";
import { generateQuotationPdf } from "@/modules/quotations/application/generateQuotationPdf.usecase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const { doc, fileName } = await generateQuotationPdf(prisma, id);
    const stream = pdfKitToReadableStream(doc);

    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        message: "Error generando PDF",
        error: { name: e?.name, message: e?.message, meta: e?.meta },
      },
      { status: 500 }
    );
  }
}
