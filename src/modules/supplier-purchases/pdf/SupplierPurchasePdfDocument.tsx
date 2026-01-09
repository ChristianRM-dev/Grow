// src/modules/supplier-purchases/pdf/SupplierPurchasePdfDocument.tsx
import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { SalesNotePdfHeaderConfig } from "@/modules/sales-notes/pdf/components/SalesNotePdfHeader";
import { SalesNotePdfHeader } from "@/modules/sales-notes/pdf/components/SalesNotePdfHeader";
import { SalesNotePdfLinesTable } from "@/modules/sales-notes/pdf/components/SalesNotePdfLinesTable";
import { SalesNotePdfTotalsBox } from "@/modules/sales-notes/pdf/components/SalesNotePdfTotalsBox";

import type { SupplierPurchasePdfDto } from "@/modules/supplier-purchases/queries/getSupplierPurchasePdfData.query";

type SupplierPurchasePdfDocumentProps = {
  header: SalesNotePdfHeaderConfig;
  headerLogoSrc: string | null;
  purchase: SupplierPurchasePdfDto;
};

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    fontFamily: "Helvetica",
  },

  section: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#000",
    padding: 10,
  },

  gridRow: {
    flexDirection: "row",
  },

  col: {
    flex: 1,
    paddingRight: 10,
  },

  label: {
    fontSize: 9,
    fontWeight: 700,
  },

  value: {
    marginTop: 2,
    marginBottom: 6,
  },

  notes: {
    marginTop: 4,
    whiteSpace: "pre-wrap" as const,
  },
});

function formatDateMX(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function SupplierPurchasePdfDocument({
  header,
  headerLogoSrc,
  purchase,
}: SupplierPurchasePdfDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <SalesNotePdfHeader
          config={header}
          logoSrc={headerLogoSrc}
          noteLabel="COMPRA"
          noteNumber={purchase.supplierFolio}
          issuedDate={formatDateMX(purchase.occurredAt)}
        />

        {/* Supplier info */}
        <View style={styles.section}>
          <View style={styles.gridRow}>
            <View style={styles.col}>
              <Text style={styles.label}>Proveedor</Text>
              <Text style={styles.value}>{purchase.partyName}</Text>
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>Fecha</Text>
              <Text style={styles.value}>
                {formatDateMX(purchase.occurredAt)}
              </Text>
            </View>
          </View>

          {purchase.notes ? (
            <>
              <Text style={styles.label}>Notas</Text>
              <Text style={[styles.value, styles.notes]}>{purchase.notes}</Text>
            </>
          ) : null}
        </View>

        {/* Lines + Total */}
        <SalesNotePdfLinesTable lines={purchase.lines} />
        <SalesNotePdfTotalsBox total={purchase.total} />
      </Page>
    </Document>
  );
}
