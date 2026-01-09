// src/modules/reports/pdf/PurchasesReportPdfDocument.tsx
import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PurchasesReportDto } from "@/modules/reports/queries/getPurchasesReport.dto";

import {
  SalesNotePdfHeader,
  type SalesNotePdfHeaderConfig,
} from "@/modules/sales-notes/pdf/components/SalesNotePdfHeader";
import { SalesNotePdfLinesTable } from "@/modules/sales-notes/pdf/components/SalesNotePdfLinesTable";
import { SalesNotePdfTotalsBox } from "@/modules/sales-notes/pdf/components/SalesNotePdfTotalsBox";

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
          <Text style={styles.topTotal}>
            Gran total: {formatMoneyFromNumber(report.grandTotal)}
          </Text>
        </View>

        {report.purchases.map((p, idx) => {
          const lines = p.lines.map((l) => ({
            description: l.description,
            quantity: String(l.quantity),
            unitPrice: String(l.unitPrice),
            lineTotal: String(l.lineTotal),
          }));

          return (
            <View key={p.id}>
              <View style={styles.block} wrap>
                <View style={styles.blockHeaderRow}>
                  <View style={styles.blockLeft}>
                    <Text style={styles.label}>Folio proveedor</Text>
                    <Text style={styles.value}>{p.supplierFolio}</Text>

                    <Text style={styles.label}>Proveedor</Text>
                    <Text style={styles.value}>{p.partyName}</Text>

                    <Text style={styles.label}>Fecha</Text>
                    <Text style={styles.value}>
                      {formatDateMX(p.occurredAt)}
                    </Text>

                    {p.notes ? (
                      <>
                        <Text style={styles.label}>Notas</Text>
                        <Text style={styles.value}>{p.notes}</Text>
                      </>
                    ) : null}
                  </View>

                  <View style={styles.blockRight}>
                    <Text style={styles.label}>Total de la compra</Text>
                    <Text style={{ fontSize: 12, fontWeight: 700 }}>
                      {formatMoneyFromNumber(p.total)}
                    </Text>
                  </View>
                </View>

                <SalesNotePdfLinesTable lines={lines} />
                <SalesNotePdfTotalsBox total={String(p.total)} />
              </View>

              {idx < report.purchases.length - 1 ? (
                <View style={styles.divider} />
              ) : null}
            </View>
          );
        })}
      </Page>
    </Document>
  );
}
