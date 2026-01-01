"use client";

import React, { createContext, useContext } from "react";

export type SupplierPurchasePaymentWizardMeta = {
  supplierPurchaseId: string;
  supplierFolio: string;
  partyId: string;
  partyName: string;

  purchaseTotal: string;
  paidTotal: string;
  remainingTotal: string;

  mode: "new" | "edit";
  currentAmount?: string;
};

const Ctx = createContext<SupplierPurchasePaymentWizardMeta | null>(null);

export function SupplierPurchasePaymentWizardProvider({
  meta,
  children,
}: {
  meta: SupplierPurchasePaymentWizardMeta;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={meta}>{children}</Ctx.Provider>;
}

export function useSupplierPurchasePaymentWizardMeta() {
  const v = useContext(Ctx);
  if (!v)
    throw new Error(
      "useSupplierPurchasePaymentWizardMeta must be used within provider"
    );
  return v;
}
