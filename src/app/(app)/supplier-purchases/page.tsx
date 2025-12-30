import { ListPageLayout } from "@/components/ui/ListPageLayout/ListPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { routes } from "@/lib/routes";

import { SupplierPurchasesTableClient } from "./supplier-purchases-table-client";
import { getSupplierPurchasesTableQuery } from "@/modules/supplier-purchases/queries/getSupplierPurchasesTable.query";

export default async function SupplierPurchasesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { data, pagination } = await getSupplierPurchasesTableQuery(
    searchParams
  );

  return (
    <ListPageLayout
      title="Compras a proveedores"
      description="Administra las compras registradas a proveedores."
      // Si ya existe la página /supplier-purchases/new, descomenta:
      fabLabel="Nueva compra"
      createRoute={routes.supplierPurchases.new()}
      breadcrumbs={<Breadcrumbs items={[{ label: "Compras a proveedores" }]} />}
    >
      <SupplierPurchasesTableClient data={data} pagination={pagination} />
    </ListPageLayout>
  );
}
