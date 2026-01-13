// Code/comments in English.
import { DateTime } from "luxon";

export const BUSINESS_TZ = "America/Mexico_City";

/**
 * Converts a YYYY-MM-DD (business date) into a JS Date representing
 * the start of that day in the business timezone, expressed as a UTC instant.
 */
export function businessDateStringToUtcDate(dateStr: string): Date {
  const dt = DateTime.fromISO(dateStr, { zone: BUSINESS_TZ }).startOf("day");
  if (!dt.isValid) {
    throw new Error(`Invalid business date: ${dateStr}`);
  }
  return dt.toJSDate();
}
