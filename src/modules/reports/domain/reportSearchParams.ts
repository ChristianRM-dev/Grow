import {
  SalesReportFiltersSchema,
  type SalesReportFilters,
} from "./salesReportFilters.schema";
import { ReportTypeEnum, type ReportType } from "./reportTypes";

export type ReportsPageState =
  | { type?: undefined } // no report selected yet
  | { type: ReportType; mode?: undefined } // report selected, filters not generated yet
  | SalesReportFilters; // valid filters (currently only sales)

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
  const type = searchParams.get("type") as ReportType | null;
  if (!type) return { type: undefined };

  const mode = searchParams.get("mode");
  if (!mode) return { type, mode: undefined };

  if (type === ReportTypeEnum.SALES) {
    const raw: Record<string, unknown> = {
      type,
      mode,
      year: searchParams.get("year") ?? undefined,
      month: searchParams.get("month") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    };

    const parsed = SalesReportFiltersSchema.safeParse(raw);
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

  if (state.type === ReportTypeEnum.SALES) {
    sp.set("mode", state.mode);

    if (state.mode === "yearMonth") {
      sp.set("year", String(state.year));
      if (typeof state.month === "number") sp.set("month", String(state.month));
    } else {
      sp.set("from", state.from);
      sp.set("to", state.to);
    }
  }

  return sp;
}

