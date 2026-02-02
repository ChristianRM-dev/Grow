import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import type { SalesReportSalesNoteDto } from "@/modules/reports/queries/getSalesReport.dto";
import { dateMX, moneyMX } from "@/modules/shared/utils/formatters";

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

  cancelledRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    backgroundColor: "#ffeaea",
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

  // Column widths (sum should fit within A4 content width)
  colCustomer: { width: 150 },
  colStatus: { width: 55 },
  colFolio: { width: 65 },
  colDate: { width: 65 },
  colTotal: { width: 60 },
  colPaid: { width: 60 },
  colBalance: { width: 60 },

  right: { textAlign: "right" },

  totalsRow: {
    flexDirection: "row",
    backgroundColor: "#f7f7f7",
  },

  totalsLabel: {
    fontWeight: 700,
  },
});

function getStatusLabel(status: SalesReportSalesNoteDto["status"]): string {
  if (status === "DRAFT") return "Borrador";
  if (status === "CONFIRMED") return "Activa";
  if (status === "CANCELLED") return "Desact.";
  return status;
}

type Props = {
  rows: SalesReportSalesNoteDto[];
  grandTotal: number;
  grandPaidTotal: number;
  grandBalanceDue: number;
};

export function SalesReportPdfResultsTable({
  rows,
  grandTotal,
  grandPaidTotal,
  grandBalanceDue,
}: Props) {
  return (
    <View style={styles.table} wrap>
      <View style={styles.headerRow} fixed>
        <Text style={[styles.cell, styles.headCell, styles.colCustomer]}>
          Cliente
        </Text>

        <Text style={[styles.cell, styles.headCell, styles.colStatus]}>
          Estado
        </Text>

        <Text style={[styles.cell, styles.headCell, styles.colFolio]}>
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

      {rows.map((r) => {
        const isCancelled = r.status === "CANCELLED";

        return (
          <View
            key={r.id}
            style={isCancelled ? styles.cancelledRow : styles.row}
          >
            <Text style={[styles.cell, styles.colCustomer]}>{r.partyName}</Text>

            <Text style={[styles.cell, styles.colStatus]}>
              {getStatusLabel(r.status)}
            </Text>

            <Text style={[styles.cell, styles.colFolio]}>{r.folio}</Text>
            <Text style={[styles.cell, styles.colDate]}>
              {dateMX(r.createdAt)}
            </Text>
            <Text style={[styles.cell, styles.colTotal, styles.right]}>
              {moneyMX(r.total)}
            </Text>
            <Text style={[styles.cell, styles.colPaid, styles.right]}>
              {moneyMX(r.paidTotal)}
            </Text>
            <Text style={[styles.cell, styles.colBalance, styles.right]}>
              {moneyMX(r.balanceDue)}
            </Text>
          </View>
        );
      })}

      <View style={styles.totalsRow}>
        <Text style={[styles.cell, styles.colCustomer, styles.totalsLabel]}>
          Totales
        </Text>
        <Text style={[styles.cell, styles.colStatus]} />
        <Text style={[styles.cell, styles.colFolio]} />
        <Text style={[styles.cell, styles.colDate]} />
        <Text
          style={[
            styles.cell,
            styles.colTotal,
            styles.right,
            styles.totalsLabel,
          ]}
        >
          {moneyMX(grandTotal)}
        </Text>
        <Text
          style={[
            styles.cell,
            styles.colPaid,
            styles.right,
            styles.totalsLabel,
          ]}
        >
          {moneyMX(grandPaidTotal)}
        </Text>
        <Text
          style={[
            styles.cell,
            styles.colBalance,
            styles.right,
            styles.totalsLabel,
          ]}
        >
          {moneyMX(grandBalanceDue)}
        </Text>
      </View>
    </View>
  );
}
