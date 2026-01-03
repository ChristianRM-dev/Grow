import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";

import { getSalesNoteAvailableMonthsByYear } from "@/modules/reports/queries/getSalesNoteAvailableMonthsByYear.query";

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

  const months = await getSalesNoteAvailableMonthsByYear(parsed.data.year);
  return NextResponse.json({ months });
}
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";

import { getSalesNoteAvailableMonthsByYear } from "@/modules/reports/queries/getSalesNoteAvailableMonthsByYear.query";

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

  const months = await getSalesNoteAvailableMonthsByYear(parsed.data.year);
  return NextResponse.json({ months });
}
