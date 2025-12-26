"use client";

import React, { createContext, useContext } from "react";

export type SalesNotePaymentWizardMeta = {
  folio: string;
  partyName: string;
  total: string; // decimal as string
  paid: string; // for edit: paid without this payment
  remaining: string; // max allowed amount
  mode: "create" | "edit";
  currentAmount?: string; // only for edit (decimal as string)
};

const SalesNotePaymentWizardContext =
  createContext<SalesNotePaymentWizardMeta | null>(null);

export function SalesNotePaymentWizardProvider({
  meta,
  children,
}: {
  meta: SalesNotePaymentWizardMeta;
  children: React.ReactNode;
}) {
  return (
    <SalesNotePaymentWizardContext.Provider value={meta}>
      {children}
    </SalesNotePaymentWizardContext.Provider>
  );
}

export function useSalesNotePaymentWizardMeta(): SalesNotePaymentWizardMeta {
  const v = useContext(SalesNotePaymentWizardContext);
  if (!v) {
    throw new Error(
      "useSalesNotePaymentWizardMeta must be used within SalesNotePaymentWizardProvider."
    );
  }
  return v;
}
