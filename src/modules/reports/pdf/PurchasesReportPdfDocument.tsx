import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PurchasesReportDto } from "@/modules/reports/queries/getPurchasesReport.dto";

import {
  SalesNotePdfHeader,
  type SalesNotePdfHeaderConfig,
} from "@/modules/sales-notes/pdf/components/SalesNotePdfHeader";
import { PurchasesReportPdfResultsTable } from "@/modules/reports/pdf/components/PurchasesReportPdfResultsTable";

type PurchasesReportPdfDocumentProps = {
  header: SalesNotePdfHeaderConfig;
  headerLogoSrc: string | null;
  report: PurchasesReportDto;
};

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    fontFamily: "Helvetica",
  },

  topSummary: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 10,
    marginTop: 8,
  },
  topTitle: {
    fontSize: 12,
    fontWeight: 700,
  },
  topSub: {
    fontSize: 10,
    marginTop: 2,
  },

  topTotalsRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topTotalItem: {
    fontSize: 10,
  },
  topTotalStrong: {
    fontWeight: 700,
  },
});

function formatDateMX(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return d.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatMoneyFromNumber(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}$${abs.toFixed(2)}`;
}

export function PurchasesReportPdfDocument({
  header,
  headerLogoSrc,
  report,
}: PurchasesReportPdfDocumentProps) {
  const issuedDate = formatDateMX(new Date());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <SalesNotePdfHeader
          config={header}
          logoSrc={headerLogoSrc}
          noteLabel="REPORTE"
          noteNumber="COMPRAS"
          issuedDate={issuedDate}
        />

        <View style={styles.topSummary}>
          <Text style={styles.topTitle}>Reporte de compras</Text>
          <Text style={styles.topSub}>{report.rangeLabel}</Text>

          <View style={styles.topTotalsRow}>
            <Text style={styles.topTotalItem}>
              Total:{" "}
              <Text style={styles.topTotalStrong}>
                {formatMoneyFromNumber(report.grandTotal)}
              </Text>
            </Text>
            <Text style={styles.topTotalItem}>
              Abonado:{" "}
              <Text style={styles.topTotalStrong}>
                {formatMoneyFromNumber(report.grandPaidTotal)}
              </Text>
            </Text>
            <Text style={styles.topTotalItem}>
              Restante:{" "}
              <Text style={styles.topTotalStrong}>
                {formatMoneyFromNumber(report.grandBalanceDue)}
              </Text>
            </Text>
          </View>
        </View>

        <PurchasesReportPdfResultsTable
          rows={report.purchases}
          grandTotal={report.grandTotal}
          grandPaidTotal={report.grandPaidTotal}
          grandBalanceDue={report.grandBalanceDue}
        />
      </Page>
    </Document>
  );
}
