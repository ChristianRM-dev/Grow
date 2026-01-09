// src/modules/sales-notes/pdf/components/SalesNotePdfSignature.tsx
import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  wrap: {
    marginTop: 18,
    alignItems: "center",
  },
  line: {
    width: 220,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: 700,
  },
});

export function SalesNotePdfSignature() {
  return (
    <View style={styles.wrap}>
      <View style={styles.line} />
      <Text style={styles.label}>Firma</Text>
    </View>
  );
}
