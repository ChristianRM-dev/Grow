// src/modules/sales-notes/pdf/components/SalesNotePdfCustomerTable.tsx
import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";

type SalesNotePdfCustomerTableProps = {
  name: string;
  address?: string | null;
  city?: string | null;
};

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: "#000",
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  rowLast: {
    flexDirection: "row",
  },
  labelCell: {
    width: 95,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: "#000",
    fontSize: 10,
    fontWeight: 700,
  },
  valueCell: {
    flexGrow: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 10,
  },
});

function safeText(v: string | null | undefined): string {
  return v?.trim() ? v : "";
}

export function SalesNotePdfCustomerTable({
  name,
  address,
  city,
}: SalesNotePdfCustomerTableProps) {
  return (
    <View style={styles.table}>
      <View style={styles.row}>
        <Text style={styles.labelCell}>Nombre:</Text>
        <Text style={styles.valueCell}>{safeText(name)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.labelCell}>Dirección:</Text>
        <Text style={styles.valueCell}>{safeText(address)}</Text>
      </View>

      <View style={styles.rowLast}>
        <Text style={styles.labelCell}>Ciudad:</Text>
        <Text style={styles.valueCell}>{safeText(city)}</Text>
      </View>
    </View>
  );
}
