/**
 * Returns today's date in YYYY-MM-DD (local time).
 * Useful for <input type="date" /> values.
 */
export function todayDateOnly(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns first day of current month in YYYY-MM-DD (local time).
 */
export function firstDayOfMonthDateOnly(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}
