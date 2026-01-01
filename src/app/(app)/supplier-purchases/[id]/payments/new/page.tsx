import { notFound } from "next/navigation";

import { FormPageLayout } from "@/components/ui/FormPageLayout/FormPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { routes } from "@/lib/routes";

import { getSupplierPurchaseForPaymentById } from "@/modules/supplier-purchases/queries/getSupplierPurchaseForPayment.query";
import { SupplierPurchasePaymentNewClient } from "./supplier-purchase-payment-new-client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SupplierPurchasePaymentNewPage({
  params,
}: Props) {
  const { id } = await params;

  const dto = await getSupplierPurchaseForPaymentById(id);
  if (!dto) return notFound();

  return (
    <FormPageLayout
      title="Registrar pago"
      description={`Agregar pago a la compra: ${dto.supplierFolio}`}
      backHref={routes.supplierPurchases.details(dto.id)}
      breadcrumbs={
        <Breadcrumbs
          items={[
            {
              label: "Compras a proveedores",
              href: routes.supplierPurchases.list(),
            },
            {
              label: dto.supplierFolio,
              href: routes.supplierPurchases.details(dto.id),
            },
            { label: "Registrar pago" },
          ]}
        />
      }
    >
      <SupplierPurchasePaymentNewClient dto={dto} />
    </FormPageLayout>
  );
}
