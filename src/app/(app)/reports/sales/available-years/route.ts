import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSalesReportAvailableYearsQuery } from "@/modules/reports/queries/getSalesReportAvailableYears.query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const years = await getSalesReportAvailableYearsQuery();
  return NextResponse.json({ years });
}
