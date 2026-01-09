// src/modules/quotations/pdf/QuotationPdfDocument.tsx
import React from "react";
import { Document, Page, StyleSheet, View } from "@react-pdf/renderer";
import {
  SalesNotePdfHeader,
  type SalesNotePdfHeaderConfig,
} from "@/modules/sales-notes/pdf/components/SalesNotePdfHeader";
import { SalesNotePdfCustomerTable } from "@/modules/sales-notes/pdf/components/SalesNotePdfCustomerTable";
import { SalesNotePdfLinesTable } from "@/modules/sales-notes/pdf/components/SalesNotePdfLinesTable";
import { SalesNotePdfTotalsBox } from "@/modules/sales-notes/pdf/components/SalesNotePdfTotalsBox";
import { SalesNotePdfSignature } from "@/modules/sales-notes/pdf/components/SalesNotePdfSignature";
import type { QuotationPdfDataDto } from "@/modules/quotations/queries/getQuotationPdfData.query";

type QuotationPdfDocumentProps = {
  header: SalesNotePdfHeaderConfig;
  headerLogoSrc: string | null;
  quotation: QuotationPdfDataDto;
};

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
});

function formatIssuedDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export function QuotationPdfDocument({
  header,
  headerLogoSrc,
  quotation,
}: QuotationPdfDocumentProps) {
  const issuedDate = formatIssuedDate(quotation.createdAtIso);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <SalesNotePdfHeader
          config={header}
          logoSrc={headerLogoSrc}
          noteLabel="COTIZACIÓN"
          noteNumber={quotation.folio}
          issuedDate={issuedDate}
        />

        <View>
          <SalesNotePdfCustomerTable
            name={quotation.customerName}
            address=""
            city=""
          />

          <SalesNotePdfLinesTable lines={quotation.lines} />

          <SalesNotePdfTotalsBox total={quotation.total} />

          <SalesNotePdfSignature label="Aceptación" />
        </View>
      </Page>
    </Document>
  );
}
