import type { SalesReportMode } from "@/modules/reports/domain/salesReportFilters.schema";

export type SalesReportLineDto = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type SalesReportSalesNoteStatusDto = "DRAFT" | "CONFIRMED" | "CANCELLED";

export type SalesReportSalesNoteDto = {
  id: string;
  folio: string;
  createdAt: string; // ISO
  partyName: string;

  status: SalesReportSalesNoteStatusDto;

  lines: SalesReportLineDto[];

  total: number;

  paidTotal: number;
  balanceDue: number;
};

export type SalesReportDto = {
  type: "sales";
  mode: SalesReportMode;
  rangeLabel: string;
  salesNotes: SalesReportSalesNoteDto[];

  grandTotal: number;
  grandPaidTotal: number;
  grandBalanceDue: number;
};
