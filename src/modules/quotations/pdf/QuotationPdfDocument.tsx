// src/modules/quotations/pdf/QuotationPdfDocument.tsx
import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Decimal } from "@prisma/client/runtime/client";
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
  plantTotalContainer: {
    marginTop: 8,
    marginBottom: 8,
    padding: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    borderLeft: "3px solid #10b981",
  },
  plantTotalText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
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

function calculateTotalPlants(lines: { quantity: string }[]): number {
  return lines.reduce((sum, line) => {
    const quantity = new Decimal(line.quantity);
    return sum + quantity.toNumber();
  }, 0);
}

export function QuotationPdfDocument({
  header,
  headerLogoSrc,
  quotation,
}: QuotationPdfDocumentProps) {
  const issuedDate = formatIssuedDate(quotation.createdAtIso);
  const totalPlants = calculateTotalPlants(quotation.lines);

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

          <View style={styles.plantTotalContainer}>
            <Text style={styles.plantTotalText}>
              Total de plantas: {totalPlants}
            </Text>
          </View>

          <SalesNotePdfLinesTable lines={quotation.lines} />

          <SalesNotePdfTotalsBox
            subtotal={quotation.subtotal}
            discountTotal={quotation.discountTotal}
            total={quotation.total}
          />

          <SalesNotePdfSignature label="Aceptación" />
        </View>
      </Page>
    </Document>
  );
}
