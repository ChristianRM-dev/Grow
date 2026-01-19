import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

import type {
  PartyPdfPartyDto,
  PartyPdfLedgerRowDto,
  PartyPdfSummaryDto,
} from "@/modules/parties/queries/getPartyPdfDataById.query";
import { moneyMX, dateMX } from "@/modules/shared/utils/formatters";

type Header = {
  logoPublicPath: string;
  nurseryName: string;
  rfc: string;
  addressLines: string[];
  phone: string;
};



function roleLabel(r: string) {
  const x = String(r).toUpperCase();
  if (x === "CUSTOMER") return "Cliente";
  if (x === "SUPPLIER") return "Proveedor";
  return r;
}

function sideLabel(s: string) {
  const x = String(s).toUpperCase();
  if (x === "RECEIVABLE") return "Por cobrar";
  if (x === "PAYABLE") return "Por pagar";
  return s;
}

function sourceTypeLabel(t: string) {
  const x = String(t).toUpperCase();
  if (x === "SALES_NOTE") return "Nota de venta";
  if (x === "PAYMENT") return "Pago";
  if (x === "SUPPLIER_PURCHASE") return "Compra";
  if (x === "ADJUSTMENT") return "Ajuste";
  return t;
}

function safeText(v: unknown) {
  const s = String(v ?? "").trim();
  return s ? s : "—";
}

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  headerLeft: { flexDirection: "row", gap: 10, alignItems: "center" },
  logo: { width: 48, height: 48, objectFit: "contain" },
  hTitle: { fontSize: 12, fontWeight: 700 },
  hMeta: { marginTop: 2, opacity: 0.8 },
  rightMeta: { textAlign: "right" },

  section: { marginTop: 14 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginBottom: 6 },

  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 6,
  },
  grid2: { flexDirection: "row", gap: 10 },
  col: { flexGrow: 1 },

  statsRow: { flexDirection: "row", gap: 10 },
  stat: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 6,
  },
  statLabel: { opacity: 0.7 },
  statValue: { marginTop: 4, fontSize: 12, fontWeight: 700 },

  table: { marginTop: 8, borderWidth: 1, borderColor: "#ddd" },
  tr: { flexDirection: "row" },
  th: {
    fontWeight: 700,
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  td: {
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cellDate: { width: "16%" },
  cellRef: { width: "22%" },
  cellType: { width: "14%" },
  cellSide: { width: "12%" },
  cellAmt: { width: "12%", textAlign: "right" },
  cellNotes: { width: "24%" },

  footer: { marginTop: 12, opacity: 0.7, fontSize: 9 },
});

export function PartyPdfDocument(props: {
  party: PartyPdfPartyDto;
  summary: PartyPdfSummaryDto;
  ledger: PartyPdfLedgerRowDto[];
  header: Header;
  headerLogoSrc: string | null;
}) {
  const { party, summary, ledger, header, headerLogoSrc } = props;

  const net = Number(summary.netTotal);
  const netIsValid = Number.isFinite(net);
  const netLabel = netIsValid
    ? net >= 0
      ? "Saldo a favor (nos deben)"
      : "Saldo en contra (debemos)"
    : "Saldo";

  const roles = party.roles?.length
    ? party.roles.map(roleLabel).join(", ")
    : "—";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        {/* <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Image style={styles.logo} src={headerLogoSrc} />
            <View>
              <Text style={styles.hTitle}>{header.nurseryName}</Text>
              <Text style={styles.hMeta}>{header.rfc}</Text>
              <Text style={styles.hMeta}>
                {header.addressLines?.filter(Boolean).join(" · ")}
              </Text>
              <Text style={styles.hMeta}>{header.phone}</Text>
            </View>
          </View>

          <View>
            <Text style={[styles.hTitle, styles.rightMeta]}>
              Estado de cuenta
            </Text>
            <Text style={[styles.hMeta, styles.rightMeta]}>
              Generado: {formatDateTime(new Date().toISOString())}
            </Text>
            <Text style={[styles.hMeta, styles.rightMeta]}>
              Contacto: {party.name}
            </Text>
          </View>
        </View> */}

        {/* Party details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del contacto</Text>
          <View style={styles.card}>
            <View style={styles.grid2}>
              <View style={styles.col}>
                <Text>
                  <Text style={{ fontWeight: 700 }}>Nombre: </Text>
                  {safeText(party.name)}
                </Text>
                <Text>
                  <Text style={{ fontWeight: 700 }}>Teléfono: </Text>
                  {safeText(party.phone)}
                </Text>
                {/* <Text>
                  <Text style={{ fontWeight: 700 }}>Rol(es): </Text>
                  {roles}
                </Text> */}
              </View>

              {/* <View style={styles.col}>
                <Text>
                  <Text style={{ fontWeight: 700 }}>Registrado: </Text>
                  {formatDateTime(party.createdAt)}
                </Text>
                <Text>
                  <Text style={{ fontWeight: 700 }}>Notas: </Text>
                  {safeText(party.notes)}
                </Text>
              </View> */}
            </View>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Por cobrar</Text>
              <Text style={styles.statValue}>
                {moneyMX(summary.receivableTotal)}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Por pagar</Text>
              <Text style={styles.statValue}>
                {moneyMX(summary.payableTotal)}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{netLabel}</Text>
              <Text style={styles.statValue}>
                {netIsValid ? moneyMX(String(Math.abs(net))) : "—"}
              </Text>
              <Text style={{ marginTop: 2, opacity: 0.7 }}>
                Neto = cobrar − pagar
              </Text>
            </View>
          </View>
        </View>

        {/* Ledger table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial contable</Text>
          <View style={styles.table}>
            <View style={styles.tr}>
              <Text style={[styles.th, styles.cellDate]}>Fecha</Text>
              <Text style={[styles.th, styles.cellRef]}>Referencia</Text>
              <Text style={[styles.th, styles.cellType]}>Tipo</Text>
              <Text style={[styles.th, styles.cellSide]}>Lado</Text>
              <Text style={[styles.th, styles.cellAmt]}>Monto</Text>
              <Text style={[styles.th, styles.cellNotes]}>Notas</Text>
            </View>

            {ledger.length ? (
              ledger.map((r) => (
                <View key={r.id} style={styles.tr}>
                  <Text style={[styles.td, styles.cellDate]}>
                    {dateMX(r.occurredAt)}
                  </Text>
                  <Text style={[styles.td, styles.cellRef]}>
                    {safeText(r.reference)}
                  </Text>
                  <Text style={[styles.td, styles.cellType]}>
                    {sourceTypeLabel(r.sourceType)}
                  </Text>
                  <Text style={[styles.td, styles.cellSide]}>
                    {sideLabel(r.side)}
                  </Text>
                  <Text style={[styles.td, styles.cellAmt]}>
                    {moneyMX(r.amount)}
                  </Text>
                  <Text style={[styles.td, styles.cellNotes]}>
                    {safeText(r.notes)}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.tr}>
                <Text style={[styles.td, { width: "100%" }]}>
                  Sin movimientos.
                </Text>
              </View>
            )}
          </View>

          {/* <Text style={styles.footer}>
            Este documento es informativo y refleja el estado de cuenta con base
            en los movimientos registrados.
          </Text> */}
        </View>
      </Page>
    </Document>
  );
}
