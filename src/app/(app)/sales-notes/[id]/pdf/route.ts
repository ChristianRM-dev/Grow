// src/app/(app)/sales-notes/[id]/pdf/route.ts
import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateSalesNotePdf } from "@/modules/sales-notes/application/generateSalesNotePdf.usecase";

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

  const { doc, fileName } = await generateSalesNotePdf(prisma, id);

  // PDFKit doc is a Node Readable stream
  const webStream = Readable.toWeb(doc as any);

  return new NextResponse(webStream as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
