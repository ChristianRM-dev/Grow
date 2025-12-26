"use client";

import React, { createContext, useContext } from "react";

export type SalesNotePaymentWizardMeta = {
  folio: string;
  partyName: string;
  total: string;
  paid: string;
  remaining: string;
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
  return React.createElement(
    SalesNotePaymentWizardContext.Provider,
    { value: meta },
    children
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
