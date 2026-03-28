// src/modules/sales-notes/pdf/components/SalesNotePdfTotalsBox.tsx
import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { moneyMX } from "@/modules/shared/utils/formatters";

type SalesNotePdfTotalsBoxProps = {
  subtotal?: string;
  discountTotal?: string;
  total: string;
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  box: {
    width: 220,
    borderWidth: 1,
    borderColor: "#000",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  rowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
  },
  value: {
    fontSize: 11,
    fontWeight: 700,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 700,
    textDecoration: "underline",
  },
});

export function SalesNotePdfTotalsBox({
  subtotal,
  discountTotal,
  total,
}: SalesNotePdfTotalsBoxProps) {
  const safeSubtotal = subtotal ?? "0";
  const safeDiscountTotal = discountTotal ?? "0";
  const showDiscount = Number(safeDiscountTotal) > 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.box}>
        {showDiscount ? (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Subtotal</Text>
              <Text style={styles.value}>{moneyMX(safeSubtotal)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Descuento</Text>
              <Text style={styles.value}>-{moneyMX(safeDiscountTotal)}</Text>
            </View>
          </>
        ) : null}
        <View style={styles.rowLast}>
          <Text style={styles.label}>Total</Text>
          <Text style={styles.totalValue}>{moneyMX(total)}</Text>
        </View>
      </View>
    </View>
  );
}
