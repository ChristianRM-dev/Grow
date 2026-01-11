import type { SalesReportMode } from "@/modules/reports/domain/salesReportFilters.schema";

export type SalesReportLineDto = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type SalesReportSalesNoteDto = {
  id: string;
  folio: string;
  createdAt: string; // ISO
  partyName: string;

  lines: SalesReportLineDto[];

  total: number;

  // NEW
  paidTotal: number;
  balanceDue: number;
};

export type SalesReportDto = {
  type: "sales";
  mode: SalesReportMode;
  rangeLabel: string;
  salesNotes: SalesReportSalesNoteDto[];

  grandTotal: number;

  // NEW
  grandPaidTotal: number;
  grandBalanceDue: number;
};
