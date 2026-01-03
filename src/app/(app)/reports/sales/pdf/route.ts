import { NextResponse } from "next/server";
import { ReadableStream } from "node:stream/web";

import { auth } from "@/auth";
import { SalesReportFiltersSchema } from "@/modules/reports/domain/salesReportFilters.schema";
import { getSalesReport } from "@/modules/reports/queries/getSalesReport.query";
import { generateSalesReportPdf } from "@/modules/reports/application/generateSalesReportPdf.usecase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const url = new URL(req.url);

  const raw = {
    type: "sales",
    mode: url.searchParams.get("mode") ?? undefined,
    year: url.searchParams.get("year") ?? undefined,
    month: url.searchParams.get("month") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  };

  const parsed = SalesReportFiltersSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Filtros inválidos", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const report = await getSalesReport(parsed.data);
    const { doc, fileName } = generateSalesReportPdf(report);

    const stream = new ReadableStream({
      start(controller) {
        doc.on("data", (chunk: Buffer) => controller.enqueue(chunk));
        doc.on("end", () => controller.close());
        doc.on("error", (err: unknown) => controller.error(err));
      },
    });

    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        // inline so it opens in a new tab and renders directly
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        message: "Error generando PDF",
        error: {
          name: e?.name,
          message: e?.message,
        },
      },
      { status: 500 }
    );
  }
}
