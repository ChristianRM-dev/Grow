// src/modules/reports/domain/reportSearchParams.ts
import {
  SalesReportFiltersSchema,
  type SalesReportFilters,
} from "./salesReportFilters.schema";
import {
  PurchasesReportFiltersSchema,
  type PurchasesReportFilters,
} from "./purchasesReportFilters.schema";

import { ReportTypeEnum, type ReportType } from "./reportTypes";

export type ReportsPageState =
  | { type?: undefined } // no report selected yet
  | { type: ReportType; mode?: undefined } // report selected, filters not generated yet
  | SalesReportFilters
  | PurchasesReportFilters;

function hasMode(
  value: ReportsPageState
): value is Extract<ReportsPageState, { mode: string }> {
  return typeof value === "object" && value !== null && "mode" in value;
}

function isValidMode(mode: string | undefined): mode is "yearMonth" | "range" {
  return mode === "yearMonth" || mode === "range";
}

/**
 * Parse the URLSearchParams into a typed report state.
 * Returns null only when the user has provided an invalid filter set.
 *
 * IMPORTANT:
 * If the URL is "incomplete" (e.g. mode is set but required fields are missing),
 * we return { type } (not null) so UI can treat it as "not generated yet".
 */
export function parseReportsPageState(
  searchParams: URLSearchParams
): ReportsPageState | null {
  const type = cleanParam(searchParams.get("type")) as ReportType | undefined;
  if (!type) return { type: undefined };

  const modeRaw = cleanParam(searchParams.get("mode"));

  // If mode is missing OR malformed (e.g. "undefined"), treat as "not generated yet"
  if (!isValidMode(modeRaw)) return { type };

  const mode = modeRaw;

  // Shared raw fields
  const year = cleanParam(searchParams.get("year"));
  const month = cleanParam(searchParams.get("month"));
  const from = cleanParam(searchParams.get("from"));
  const to = cleanParam(searchParams.get("to"));

  // Extras (optional)
  const status = cleanParam(searchParams.get("status")); // sales only
  const partyId = cleanParam(searchParams.get("partyId")); // sales + purchases
  const partyName = cleanParam(searchParams.get("partyName")); // label hydration

  // If URL looks "incomplete", don't mark it invalid; treat as "filters not generated yet".
  if (mode === "yearMonth" && !year) return { type };
  if (mode === "range" && (!from || !to)) return { type };

  const raw: Record<string, unknown> = {
    type,
    mode,
    year,
    month,
    from,
    to,
    status,
    partyId,
    partyName,
  };

  if (type === ReportTypeEnum.SALES) {
    const parsed = SalesReportFiltersSchema.safeParse(raw);
    if (!parsed.success) return null;
    return parsed.data;
  }

  if (type === ReportTypeEnum.PURCHASES) {
    const parsed = PurchasesReportFiltersSchema.safeParse(raw);
    if (!parsed.success) return null;
    return parsed.data;
  }

  return null;
}

/**
 * Serialize a report state into stable URL search params.
 */
export function serializeReportsPageState(
  state: ReportsPageState
): URLSearchParams {
  const sp = new URLSearchParams();

  if (!state.type) return sp;
  sp.set("type", state.type);

  if (!hasMode(state)) return sp;
  sp.set("mode", state.mode);

  if (state.mode === "yearMonth") {
    sp.set("year", String(state.year));
    if (typeof state.month === "number") sp.set("month", String(state.month));
  } else {
    sp.set("from", state.from);
    sp.set("to", state.to);
  }

  // Shared extra: party filter (sales + purchases)
  const partyId = (state as any).partyId as string | undefined;
  const partyName = (state as any).partyName as string | undefined;

  if (partyId) sp.set("partyId", partyId);
  if (partyName) sp.set("partyName", partyName);

  // Sales-only extra: status
  if (state.type === ReportTypeEnum.SALES) {
    const s = state as SalesReportFilters;
    if (s.status && s.status !== "all") sp.set("status", s.status);
  }

  return sp;
}

export function isCompleteSalesReportFilters(
  state: ReportsPageState | null
): state is SalesReportFilters {
  return (
    !!state &&
    state.type === ReportTypeEnum.SALES &&
    (state as SalesReportFilters).mode !== undefined
  );
}

export function isCompletePurchasesReportFilters(
  state: ReportsPageState | null
): state is PurchasesReportFilters {
  return (
    !!state &&
    state.type === ReportTypeEnum.PURCHASES &&
    (state as PurchasesReportFilters).mode !== undefined
  );
}

function cleanParam(v: string | null): string | undefined {
  if (!v) return undefined;
  const t = v.trim();
  if (!t || t === "undefined" || t === "null") return undefined;
  return t;
}
