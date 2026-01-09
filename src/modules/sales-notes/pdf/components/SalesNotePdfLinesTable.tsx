// src/modules/sales-notes/pdf/components/SalesNotePdfLinesTable.tsx
import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatMoney, formatQty } from "@/modules/shared/pdf/formatters";
import { PdfLineDto } from "@/modules/shared/pdf/pdfDtos";

type SalesNotePdfLinesTableProps = {
  lines: PdfLineDto[];
};

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: "#000",
    marginTop: 10,
  },

  headerRow: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  rowLast: {
    flexDirection: "row",
  },

  cell: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 10,
  },

  colQty: {
    width: "16%",
    borderRightWidth: 1,
    borderRightColor: "#000",
    textAlign: "center" as const,
  },
  colDesc: {
    width: "54%",
    borderRightWidth: 1,
    borderRightColor: "#000",
  },
  colUnit: {
    width: "15%",
    borderRightWidth: 1,
    borderRightColor: "#000",
    textAlign: "right" as const,
  },
  colTotal: {
    width: "15%",
    textAlign: "right" as const,
  },

  headerText: {
    fontWeight: 700,
  },
});

export function SalesNotePdfLinesTable({ lines }: SalesNotePdfLinesTableProps) {
  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        <Text style={[styles.cell, styles.colQty, styles.headerText]}>
          Cantidad
        </Text>
        <Text style={[styles.cell, styles.colDesc, styles.headerText]}>
          Descripción
        </Text>
        <Text style={[styles.cell, styles.colUnit, styles.headerText]}>
          P. Unitario
        </Text>
        <Text style={[styles.cell, styles.colTotal, styles.headerText]}>
          Total
        </Text>
      </View>

      {lines.map((l, idx) => {
        const isLast = idx === lines.length - 1;
        return (
          <View key={idx} style={isLast ? styles.rowLast : styles.row}>
            <Text style={[styles.cell, styles.colQty]}>
              {formatQty(l.quantity)}
            </Text>
            <Text style={[styles.cell, styles.colDesc]}>{l.description}</Text>
            <Text style={[styles.cell, styles.colUnit]}>
              {formatMoney(l.unitPrice)}
            </Text>
            <Text style={[styles.cell, styles.colTotal]}>
              {formatMoney(l.lineTotal)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
