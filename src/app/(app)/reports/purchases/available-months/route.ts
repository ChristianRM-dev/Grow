// src/app/(app)/reports/purchases/available-months/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getPurchasesReportAvailableMonthsQuery } from "@/modules/reports/queries/getPurchasesReportAvailableMonths.query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    year: url.searchParams.get("year"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Parámetros inválidos", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const months = await getPurchasesReportAvailableMonthsQuery(parsed.data.year);
  return NextResponse.json({ months });
}
