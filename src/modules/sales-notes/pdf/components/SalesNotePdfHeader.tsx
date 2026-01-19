// src/modules/sales-notes/pdf/components/SalesNotePdfHeader.tsx
import React from "react";
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";

export type SalesNotePdfHeaderConfig = {
  logoPublicPath: string;
  nurseryName: string;
  rfc: string;
  addressLines: string[];
  phone: string;
  email: string;
  issuedPlaceLine1: string;
  issuedPlaceLine2: string;
};

type SalesNotePdfHeaderProps = {
  config: SalesNotePdfHeaderConfig;

  // Resolved image source (data-uri recommended)
  logoSrc: string | null;

  noteLabel: string; // "NOTA"
  noteNumber: string; // "N25441" (or your salesNoteId formatted)
  issuedDate: string; // "25/11/25" or ISO formatted
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center", // <-- ensures vertical centering across columns
    marginBottom: 10,
  },

  left: {
    width: 180, // Increased from 140
    paddingRight: 8,
    justifyContent: "center",
  },
  logoBox: {
    borderWidth: 0.1,
    padding: 6,
    height: 130, // Increased from 90
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 160, // Increased from 120
    height: 90, // Increased from 70
    objectFit: "contain",
  },
  logoFallback: {
    fontSize: 9,
    textAlign: "center",
  },

  center: {
    flexGrow: 1,
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center", // <-- ensures true horizontal centering
  },
  centerTitle: {
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 2,
  },
  centerLine: {
    fontSize: 9.5,
    textAlign: "center",
    lineHeight: 1.25,
  },
  centerLineBold: {
    fontSize: 9.5,
    textAlign: "center",
    fontWeight: 700,
    marginTop: 1,
    lineHeight: 1.25,
  },

  right: {
    width: 100, // Reduced from 150
    paddingLeft: 8,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  box: {
    borderWidth: 1,
    borderColor: "#000",
  },
  boxRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  boxRowLast: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  boxLabel: {
    fontSize: 10, // Reduced from 11
    fontWeight: 700,
  },
  boxValue: {
    fontSize: 10, // Reduced from 11
    fontWeight: 700,
  },

  spacer: { height: 8 },
});

export function SalesNotePdfHeader({
  config,
  logoSrc,
  noteLabel,
  noteNumber,
  issuedDate,
}: SalesNotePdfHeaderProps) {
  return (
    <View style={styles.root}>
      {/* Left: logo */}
      <View style={styles.left}>
        <View style={styles.logoBox}>
          {logoSrc ? (
            <Image style={styles.logo} src={logoSrc} />
          ) : (
            <Text style={styles.logoFallback}>Logo no disponible</Text>
          )}
        </View>
      </View>

      {/* Center: nursery info */}
      <View style={styles.center}>
        <Text style={styles.centerTitle}>{config.nurseryName}</Text>
        <Text style={styles.centerLineBold}>{config.rfc}</Text>
        {config.addressLines.map((line, idx) => (
          <Text key={idx} style={styles.centerLine}>
            {line}
          </Text>
        ))}
        <Text style={styles.centerLine}>{config.phone}</Text>
        <Text style={styles.centerLine}>{config.email}</Text>
      </View>

      {/* Right: boxes */}
      <View style={styles.right}>
        {/* NOTA box */}
        <View style={styles.box}>
          <View style={styles.boxRow}>
            <Text style={styles.boxLabel}>{noteLabel}</Text>
          </View>
          <View style={styles.boxRowLast}>
            <Text style={styles.boxValue}>{noteNumber}</Text>
          </View>
        </View>

        <View style={styles.spacer} />

        {/* EXPEDIDO box */}
        <View style={styles.box}>
          <View style={styles.boxRow}>
            <Text style={styles.boxLabel}>{config.issuedPlaceLine1}</Text>
          </View>
          <View style={styles.boxRow}>
            <Text style={styles.boxValue}>{config.issuedPlaceLine2}</Text>
          </View>
          <View style={styles.boxRowLast}>
            <Text style={styles.boxValue}>{issuedDate}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
