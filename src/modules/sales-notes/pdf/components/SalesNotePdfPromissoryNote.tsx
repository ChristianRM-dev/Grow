// src/modules/sales-notes/pdf/components/SalesNotePdfPromissoryNote.tsx
import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatMoney } from "@/modules/shared/pdf/formatters";

type SalesNotePdfPromissoryNoteProps = {
  payeeName: string;
  total: string;
  totalInWords: string;
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
  },
  text: {
    fontSize: 9.5,
    lineHeight: 1.25,
  },
  bold: {
    fontWeight: 700,
  },
});

export function SalesNotePdfPromissoryNote({
  payeeName,
  total,
  totalInWords,
}: SalesNotePdfPromissoryNoteProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>
        Debo (emos) y pagaré (mos) a la orden de{" "}
        <Text style={styles.bold}>{payeeName}</Text> en esta ciudad o cualquiera
        otra que se requiera pago el día{" "}
        <Text style={styles.bold}>__________</Text> la cantidad de ${" "}
        <Text style={styles.bold}>{formatMoney(total)}</Text> (
        <Text style={styles.bold}>{totalInWords}</Text> -m.n.) valor del
        servicio recibido a mi (nuestra) entera satisfacción, de no hacerlo así
        causará un interés del <Text style={styles.bold}>____%</Text> mensual, a
        partir de la fecha de vencimiento.
      </Text>

      <Text style={[styles.text, { marginTop: 6 }]}>
        Este pagaré es mercantil y está regido por la ley general de títulos y
        operaciones de crédito en su artículo 173 parte final demás artículos
        correlativos por no ser pagaré domiciliario.
      </Text>
    </View>
  );
}
