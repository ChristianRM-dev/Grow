import { FormPageLayout } from "@/components/ui/FormPageLayout/FormPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { routes } from "@/lib/routes";
import { SupplierPurchaseNewClient } from "./supplier-purchase-new-client";

export default function SupplierPurchaseNewPage() {
  return (
    <FormPageLayout
      title="Nueva compra a proveedor"
      description="Registra una compra y actualiza el saldo del proveedor."
      backHref={routes.supplierPurchases.list()}
      breadcrumbs={
        <Breadcrumbs
          items={[
            {
              label: "Compras a proveedores",
              href: routes.supplierPurchases.list(),
            },
            { label: "Nueva" },
          ]}
        />
      }
    >
      <SupplierPurchaseNewClient />
    </FormPageLayout>
  );
}
