// src/modules/sales-notes/pdf/SalesNotePdfDocument.tsx
import React from "react";
import { Document, Page, StyleSheet, View, Text } from "@react-pdf/renderer";
import {
  SalesNotePdfHeader,
  type SalesNotePdfHeaderConfig,
} from "@/modules/sales-notes/pdf/components/SalesNotePdfHeader";
import type { SalesNotePdfDataDto } from "@/modules/sales-notes/queries/getSalesNotePdfData.query";
import { SalesNotePdfCustomerTable } from "@/modules/sales-notes/pdf/components/SalesNotePdfCustomerTable";
import { SalesNotePdfLinesTable } from "@/modules/sales-notes/pdf/components/SalesNotePdfLinesTable";
import { SalesNotePdfTotalsBox } from "./components/SalesNotePdfTotalsBox";
import { SalesNotePdfPromissoryNote } from "./components/SalesNotePdfPromissoryNote";
import { SalesNotePdfSignature } from "./components/SalesNotePdfSignature";
import { Decimal } from "@prisma/client/runtime/client";

type SalesNotePdfDocumentProps = {
  header: SalesNotePdfHeaderConfig;
  headerLogoSrc: string | null;
  salesNote: SalesNotePdfDataDto;
  totalInWords: string;
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

/**
 * Calculate total number of plants by summing quantities from all lines
 */
function calculateTotalPlants(lines: { quantity: string }[]): number {
  return lines.reduce((sum, line) => {
    const quantity = new Decimal(line.quantity);
    return sum + quantity.toNumber();
  }, 0);
}

export function SalesNotePdfDocument({
  header,
  headerLogoSrc,
  salesNote,
  totalInWords,
}: SalesNotePdfDocumentProps) {
  const issuedDate = formatIssuedDate(salesNote.createdAtIso);
  const totalPlants = calculateTotalPlants(salesNote.lines);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <SalesNotePdfHeader
          config={header}
          logoSrc={headerLogoSrc}
          noteLabel="NOTA"
          noteNumber={salesNote.folio} // folio, not id
          issuedDate={issuedDate}
        />

        <View>
          <SalesNotePdfCustomerTable
            name={salesNote.customerName}
            // Not in schema yet — keep blank until you add fields or a Party "address" model.
            address=""
            city=""
          />

          <View style={styles.plantTotalContainer}>
            <Text style={styles.plantTotalText}>
              Total de plantas: {totalPlants}
            </Text>
          </View>

          <SalesNotePdfLinesTable lines={salesNote.lines} />
          <SalesNotePdfTotalsBox total={salesNote.total} />
          <SalesNotePdfPromissoryNote
            payeeName="JUAN JOSE MORALES RIOS"
            total={salesNote.total}
            totalInWords={totalInWords}
          />
          <SalesNotePdfSignature />
        </View>
      </Page>
    </Document>
  );
}
