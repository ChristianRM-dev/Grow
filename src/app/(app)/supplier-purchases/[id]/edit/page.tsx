import React from "react";
import { notFound } from "next/navigation";

import { FormPageLayout } from "@/components/ui/FormPageLayout/FormPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { routes } from "@/lib/routes";

import { getSupplierPurchaseForEditById } from "@/modules/supplier-purchases/queries/getSupplierPurchaseForEdit.query";
import { SupplierPurchaseEditClient } from "./supplier-purchase-edit-client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SupplierPurchaseEditPage({ params }: Props) {
  const { id } = await params;

  const dto = await getSupplierPurchaseForEditById(id);
  if (!dto) return notFound();

  return (
    <FormPageLayout
      title="Editar compra a proveedor"
      description="Actualiza la compra y mantiene el saldo consistente."
      backHref={routes.supplierPurchases.details(dto.id)}
      breadcrumbs={
        <Breadcrumbs
          items={[
            {
              label: "Compras a proveedores",
              href: routes.supplierPurchases.list(),
            },
            {
              label: dto.supplierFolio || "Compra",
              href: routes.supplierPurchases.details(dto.id),
            },
            { label: "Editar" },
          ]}
        />
      }
    >
      <SupplierPurchaseEditClient purchase={dto} />
    </FormPageLayout>
  );
}
