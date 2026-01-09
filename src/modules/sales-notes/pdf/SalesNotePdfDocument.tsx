// src/modules/sales-notes/pdf/SalesNotePdfDocument.tsx
import React from "react";
import { Document, Page, StyleSheet, View } from "@react-pdf/renderer";
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
});

function formatIssuedDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export function SalesNotePdfDocument({
  header,
  headerLogoSrc,
  salesNote,
  totalInWords,
}: SalesNotePdfDocumentProps) {
  const issuedDate = formatIssuedDate(salesNote.createdAtIso);

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
            // Not in schema yet — keep blank until you add fields or a Party “address” model.
            address=""
            city=""
          />

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
