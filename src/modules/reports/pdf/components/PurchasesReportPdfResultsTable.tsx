import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PurchasesReportPurchaseDto } from "@/modules/reports/queries/getPurchasesReport.dto";

const styles = StyleSheet.create({
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#000",
  },

  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    backgroundColor: "#f2f2f2",
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },

  cell: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontSize: 9,
  },

  headCell: {
    fontWeight: 700,
    fontSize: 9,
  },

  // Column widths
  colSupplier: { width: 170 },
  colSupplierFolio: { width: 80 },
  colDate: { width: 70 },
  colTotal: { width: 65 },
  colPaid: { width: 65 },
  colBalance: { width: 65 },

  right: { textAlign: "right" },

  totalsRow: {
    flexDirection: "row",
    backgroundColor: "#f7f7f7",
  },

  totalsLabel: {
    fontWeight: 700,
  },
});

function formatDateMXShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatMoney(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}$${abs.toFixed(2)}`;
}

type Props = {
  rows: PurchasesReportPurchaseDto[];
  grandTotal: number;
  grandPaidTotal: number;
  grandBalanceDue: number;
};

export function PurchasesReportPdfResultsTable({
  rows,
  grandTotal,
  grandPaidTotal,
  grandBalanceDue,
}: Props) {
  return (
    <View style={styles.table} wrap>
      <View style={styles.headerRow} fixed>
        <Text style={[styles.cell, styles.headCell, styles.colSupplier]}>
          Proveedor
        </Text>
        <Text style={[styles.cell, styles.headCell, styles.colSupplierFolio]}>
          Folio
        </Text>
        <Text style={[styles.cell, styles.headCell, styles.colDate]}>
          Fecha
        </Text>
        <Text
          style={[styles.cell, styles.headCell, styles.colTotal, styles.right]}
        >
          Total
        </Text>
        <Text
          style={[styles.cell, styles.headCell, styles.colPaid, styles.right]}
        >
          Abonado
        </Text>
        <Text
          style={[
            styles.cell,
            styles.headCell,
            styles.colBalance,
            styles.right,
          ]}
        >
          Restante
        </Text>
      </View>

      {rows.map((r) => (
        <View key={r.id} style={styles.row}>
          <Text style={[styles.cell, styles.colSupplier]} maxLines={1}>
            {r.partyName}
          </Text>
          <Text style={[styles.cell, styles.colSupplierFolio]} maxLines={1}>
            {r.supplierFolio}
          </Text>
          <Text style={[styles.cell, styles.colDate]}>
            {formatDateMXShort(r.occurredAt)}
          </Text>
          <Text style={[styles.cell, styles.colTotal, styles.right]}>
            {formatMoney(r.total)}
          </Text>
          <Text style={[styles.cell, styles.colPaid, styles.right]}>
            {formatMoney(r.paidTotal)}
          </Text>
          <Text style={[styles.cell, styles.colBalance, styles.right]}>
            {formatMoney(r.balanceDue)}
          </Text>
        </View>
      ))}

      <View style={styles.totalsRow}>
        <Text style={[styles.cell, styles.colSupplier, styles.totalsLabel]}>
          Totales
        </Text>
        <Text style={[styles.cell, styles.colSupplierFolio]} />
        <Text style={[styles.cell, styles.colDate]} />
        <Text
          style={[
            styles.cell,
            styles.colTotal,
            styles.right,
            styles.totalsLabel,
          ]}
        >
          {formatMoney(grandTotal)}
        </Text>
        <Text
          style={[
            styles.cell,
            styles.colPaid,
            styles.right,
            styles.totalsLabel,
          ]}
        >
          {formatMoney(grandPaidTotal)}
        </Text>
        <Text
          style={[
            styles.cell,
            styles.colBalance,
            styles.right,
            styles.totalsLabel,
          ]}
        >
          {formatMoney(grandBalanceDue)}
        </Text>
      </View>
    </View>
  );
}
