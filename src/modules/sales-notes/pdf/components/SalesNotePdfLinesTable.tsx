// src/modules/sales-notes/pdf/components/SalesNotePdfLinesTable.tsx
import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { PdfLineDto } from "@/modules/shared/pdf/pdfDtos";
import { formatQty, moneyMX } from "@/modules/shared/utils/formatters";
import {
  formatDiscountLabel,
  hasAnyDiscount,
} from "@/modules/shared/utils/discounts";

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
    borderRightWidth: 1,
    borderRightColor: "#000",
    textAlign: "center" as const,
  },
  colDesc: {
    borderRightWidth: 1,
    borderRightColor: "#000",
  },
  colUnit: {
    borderRightWidth: 1,
    borderRightColor: "#000",
    textAlign: "right" as const,
  },
  colDiscount: {
    borderRightWidth: 1,
    borderRightColor: "#000",
    textAlign: "right" as const,
  },
  colTotal: {
    textAlign: "right" as const,
  },
  headerText: {
    fontWeight: 700,
  },
});

export function SalesNotePdfLinesTable({ lines }: SalesNotePdfLinesTableProps) {
  const showDiscountColumn = hasAnyDiscount(lines);

  const qtyStyle = showDiscountColumn
    ? { width: "14%" }
    : { width: "18%" };
  const descStyle = showDiscountColumn
    ? { width: "40%" }
    : { width: "50%" };
  const unitStyle = showDiscountColumn
    ? { width: "15%" }
    : { width: "16%" };
  const discountStyle = { width: "13%" };
  const totalStyle = showDiscountColumn
    ? { width: "18%" }
    : { width: "16%" };

  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        <Text style={[styles.cell, styles.colQty, qtyStyle, styles.headerText]}>
          Cantidad
        </Text>
        <Text style={[styles.cell, styles.colDesc, descStyle, styles.headerText]}>
          Descripción
        </Text>
        <Text style={[styles.cell, styles.colUnit, unitStyle, styles.headerText]}>
          P. Unitario
        </Text>
        {showDiscountColumn ? (
          <Text
            style={[
              styles.cell,
              styles.colDiscount,
              discountStyle,
              styles.headerText,
            ]}
          >
            Desc.
          </Text>
        ) : null}
        <Text style={[styles.cell, styles.colTotal, totalStyle, styles.headerText]}>
          Total
        </Text>
      </View>

      {lines.map((l, idx) => {
        const isLast = idx === lines.length - 1;
        return (
          <View key={idx} style={isLast ? styles.rowLast : styles.row}>
            <Text style={[styles.cell, styles.colQty, qtyStyle]}>
              {formatQty(l.quantity)}
            </Text>
            <Text style={[styles.cell, styles.colDesc, descStyle]}>
              {l.description}
            </Text>
            <Text style={[styles.cell, styles.colUnit, unitStyle]}>
              {moneyMX(l.unitPrice)}
            </Text>
            {showDiscountColumn ? (
              <Text style={[styles.cell, styles.colDiscount, discountStyle]}>
                {formatDiscountLabel(l.discountPercent)}
              </Text>
            ) : null}
            <Text style={[styles.cell, styles.colTotal, totalStyle]}>
              {moneyMX(l.lineTotal)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
