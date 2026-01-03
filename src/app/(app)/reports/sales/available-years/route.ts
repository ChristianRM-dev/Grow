import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSalesNoteAvailableYears } from "@/modules/reports/queries/getSalesNoteAvailableYears.query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const years = await getSalesNoteAvailableYears();
  return NextResponse.json({ years });
}
