// src/modules/shared/pdf/pdfDtos.ts
export type PdfLineDto = {
  description: string;
  quantity: string; // Decimal as string
  unitPrice: string; // Decimal as string
  lineTotal: string; // Decimal as string
};
