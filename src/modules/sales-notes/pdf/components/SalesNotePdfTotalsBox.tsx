// src/modules/sales-notes/pdf/components/SalesNotePdfTotalsBox.tsx
import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatMoney } from "@/modules/shared/pdf/formatters";

type SalesNotePdfTotalsBoxProps = {
  total: string;
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  box: {
    width: 180,
    borderWidth: 1,
    borderColor: "#000",
  },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLast: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
  },
  value: {
    fontSize: 12,
    fontWeight: 700,
    textDecoration: "underline",
  },
});

export function SalesNotePdfTotalsBox({ total }: SalesNotePdfTotalsBoxProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.box}>
        <View style={styles.row}>
          <Text style={styles.label}>Total</Text>
        </View>
        <View style={styles.rowLast}>
          <Text style={styles.value}>{formatMoney(total)}</Text>
        </View>
      </View>
    </View>
  );
}
