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

/**
 * Parse the URLSearchParams into a typed report state.
 * Returns null only when the user has provided an invalid filter set.
 */
export function parseReportsPageState(
  searchParams: URLSearchParams
): ReportsPageState | null {
  const type = cleanParam(searchParams.get("type")) as ReportType | undefined;
  if (!type) return { type: undefined };

  const mode = cleanParam(searchParams.get("mode"));
  if (!mode) return { type }; // If mode is missing/undefined, treat as "no filters yet"

  const raw: Record<string, unknown> = {
    type,
    mode,
    year: cleanParam(searchParams.get("year")),
    month: cleanParam(searchParams.get("month")),
    from: cleanParam(searchParams.get("from")),
    to: cleanParam(searchParams.get("to")),
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
    return sp;
  }

  // range
  sp.set("from", state.from);
  sp.set("to", state.to);

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
