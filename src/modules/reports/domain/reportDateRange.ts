export const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

function startOfMonthUtc(year: number, month1to12: number) {
  return new Date(Date.UTC(year, month1to12 - 1, 1, 0, 0, 0, 0));
}

function startOfNextMonthUtc(year: number, month1to12: number) {
  if (month1to12 === 12) return new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
  return new Date(Date.UTC(year, month1to12, 1, 0, 0, 0, 0));
}

function startOfYearUtc(year: number) {
  return new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
}

function startOfNextYearUtc(year: number) {
  return new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
}

function parseDateOnlyToUtcStart(dateOnly: string) {
  // dateOnly must be YYYY-MM-DD (validated by Zod upstream)
  return new Date(`${dateOnly}T00:00:00.000Z`);
}

function addDaysUtc(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Supports your existing report filter shapes:
 * - mode: "yearMonth" (with year and optional month)
 * - mode: "range" (with from/to as YYYY-MM-DD)
 *
 * It also tolerates extra fields like "type" without caring about them.
 */
export type ReportDateRangeInput =
  | {
      mode: "yearMonth";
      year: number;
      month?: number | null;
      [key: string]: unknown; // tolerate extra fields like "type"
    }
  | {
      mode: "range";
      from: string; // YYYY-MM-DD
      to: string; // YYYY-MM-DD
      [key: string]: unknown; // tolerate extra fields like "type"
    };

export function getReportDateRange(input: ReportDateRangeInput): {
  from: Date;
  toExclusive: Date;
  rangeLabel: string;
} {
  if (input.mode === "yearMonth") {
    const year = input.year;
    const month = input.month;

    if (typeof month === "number") {
      const from = startOfMonthUtc(year, month);
      const toExclusive = startOfNextMonthUtc(year, month);
      const rangeLabel = `${MONTHS_ES[month - 1]} ${year}`;
      return { from, toExclusive, rangeLabel };
    }

    const from = startOfYearUtc(year);
    const toExclusive = startOfNextYearUtc(year);
    const rangeLabel = `Año ${year}`;
    return { from, toExclusive, rangeLabel };
  }

  // mode === "range"
  const fromDate = parseDateOnlyToUtcStart(input.from);
  const toDate = parseDateOnlyToUtcStart(input.to);

  const from = fromDate;
  const toExclusive = addDaysUtc(toDate, 1); // inclusive "to"
  const rangeLabel = `${input.from} → ${input.to}`;

  return { from, toExclusive, rangeLabel };
}
