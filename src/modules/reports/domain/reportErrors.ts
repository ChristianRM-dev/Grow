export const ReportErrorCode = {
  INVALID_FILTERS: "INVALID_FILTERS",
  NOT_AUTHORIZED: "NOT_AUTHORIZED",
} as const;

export type ReportErrorCode =
  (typeof ReportErrorCode)[keyof typeof ReportErrorCode];
