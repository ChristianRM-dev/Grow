// src/modules/reports/domain/reportTypes.ts
export const ReportTypeEnum = {
  SALES: "sales",
  PURCHASES: "purchases",
  // INVENTORY: "inventory",
  // CUSTOMERS: "customers",
} as const;

export type ReportType = (typeof ReportTypeEnum)[keyof typeof ReportTypeEnum];

export const REPORT_TYPE_OPTIONS: Array<{ value: ReportType; label: string }> =
  [
    { value: ReportTypeEnum.SALES, label: "Ventas" },
    { value: ReportTypeEnum.PURCHASES, label: "Compras" },
  ];
