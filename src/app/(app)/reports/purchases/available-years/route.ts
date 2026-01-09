// src/app/(app)/reports/purchases/available-years/route.ts
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getPurchasesReportAvailableYearsQuery } from "@/modules/reports/queries/getPurchasesReportAvailableYears.query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const years = await getPurchasesReportAvailableYearsQuery();
  return NextResponse.json({ years });
}
