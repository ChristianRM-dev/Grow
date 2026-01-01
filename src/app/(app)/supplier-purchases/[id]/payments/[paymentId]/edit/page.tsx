import React from "react";
import { notFound } from "next/navigation";

import { FormPageLayout } from "@/components/ui/FormPageLayout/FormPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { routes } from "@/lib/routes";

import { getSupplierPurchasePaymentForEdit } from "@/modules/supplier-purchases/queries/getSupplierPurchasePaymentForEdit.query";
import { SupplierPurchasePaymentEditClient } from "./supplier-purchase-payment-edit-client";

type Props = {
  params: Promise<{ id: string; paymentId: string }>;
};

export default async function SupplierPurchasePaymentEditPage({
  params,
}: Props) {
  const { id, paymentId } = await params;

  const dto = await getSupplierPurchasePaymentForEdit({
    supplierPurchaseId: id,
    paymentId,
  });

  if (!dto) return notFound();

  return (
    <FormPageLayout
      title="Editar pago"
      description={`Editar pago de la compra: ${dto.supplierPurchase.supplierFolio}`}
      backHref={routes.supplierPurchases.details(dto.supplierPurchase.id)}
      breadcrumbs={
        <Breadcrumbs
          items={[
            {
              label: "Compras a proveedores",
              href: routes.supplierPurchases.list(),
            },
            {
              label: dto.supplierPurchase.supplierFolio,
              href: routes.supplierPurchases.details(dto.supplierPurchase.id),
            },
            { label: "Editar pago" },
          ]}
        />
      }
    >
      <SupplierPurchasePaymentEditClient dto={dto} />
    </FormPageLayout>
  );
}
