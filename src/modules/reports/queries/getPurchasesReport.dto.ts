// src/modules/reports/queries/getPurchasesReport.dto.ts
import type { PurchasesReportMode } from "@/modules/reports/domain/purchasesReportFilters.schema";

export type PurchasesReportLineDto = {
  // For purchases we don't have per-line items yet (no model).
  // We'll provide a single synthetic line for display purposes.
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type PurchasesReportPurchaseDto = {
  id: string;
  supplierFolio: string;
  occurredAt: string; // ISO
  partyName: string;
  notes: string | null;
  lines: PurchasesReportLineDto[];
  total: number;
};

export type PurchasesReportDto = {
  type: "purchases";
  mode: PurchasesReportMode;
  rangeLabel: string;
  purchases: PurchasesReportPurchaseDto[];
  grandTotal: number;
};
