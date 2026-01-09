// src/modules/reports/pdf/SalesReportPdfDocument.tsx
import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { SalesReportDto } from "@/modules/reports/queries/getSalesReport.dto";
import {
  SalesNotePdfHeader,
  type SalesNotePdfHeaderConfig,
} from "@/modules/sales-notes/pdf/components/SalesNotePdfHeader";
import { SalesNotePdfLinesTable } from "@/modules/sales-notes/pdf/components/SalesNotePdfLinesTable";
import { SalesNotePdfTotalsBox } from "@/modules/sales-notes/pdf/components/SalesNotePdfTotalsBox";

type SalesReportPdfDocumentProps = {
  header: SalesNotePdfHeaderConfig;
  headerLogoSrc: string | null;
  report: SalesReportDto;
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
  topTotal: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: 700,
  },

  block: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#000",
    padding: 10,
  },
  blockHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  blockLeft: {
    flexGrow: 1,
    paddingRight: 10,
  },
  label: {
    fontSize: 9,
    fontWeight: 700,
  },
  value: {
    fontSize: 10,
    marginBottom: 3,
  },
  blockRight: {
    width: 160,
    alignItems: "flex-end",
  },
  divider: {
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    opacity: 0.4,
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

export function SalesReportPdfDocument({
  header,
  headerLogoSrc,
  report,
}: SalesReportPdfDocumentProps) {
  // We reuse the same header layout, but with report label.
  const issuedDate = formatDateMX(new Date());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <SalesNotePdfHeader
          config={header}
          logoSrc={headerLogoSrc}
          noteLabel="REPORTE"
          noteNumber="VENTAS"
          issuedDate={issuedDate}
        />

        <View style={styles.topSummary}>
          <Text style={styles.topTitle}>Reporte de ventas</Text>
          <Text style={styles.topSub}>{report.rangeLabel}</Text>
          <Text style={styles.topTotal}>
            Gran total: {formatMoneyFromNumber(report.grandTotal)}
          </Text>
        </View>

        {report.salesNotes.map((sn, idx) => {
          const lines = sn.lines.map((l) => ({
            description: l.description,
            quantity: String(l.quantity),
            unitPrice: String(l.unitPrice),
            lineTotal: String(l.lineTotal),
          }));

          return (
            <View key={sn.id}>
              <View style={styles.block} wrap>
                <View style={styles.blockHeaderRow}>
                  <View style={styles.blockLeft}>
                    <Text style={styles.label}>Folio</Text>
                    <Text style={styles.value}>{sn.folio}</Text>

                    <Text style={styles.label}>Cliente</Text>
                    <Text style={styles.value}>{sn.partyName}</Text>

                    <Text style={styles.label}>Fecha</Text>
                    <Text style={styles.value}>
                      {formatDateMX(sn.createdAt)}
                    </Text>
                  </View>

                  <View style={styles.blockRight}>
                    <Text style={styles.label}>Total de la venta</Text>
                    <Text style={{ fontSize: 12, fontWeight: 700 }}>
                      {formatMoneyFromNumber(sn.total)}
                    </Text>
                  </View>
                </View>

                <SalesNotePdfLinesTable lines={lines} />
                <SalesNotePdfTotalsBox total={String(sn.total)} />
              </View>

              {idx < report.salesNotes.length - 1 ? (
                <View style={styles.divider} />
              ) : null}
            </View>
          );
        })}
      </Page>
    </Document>
  );
}
