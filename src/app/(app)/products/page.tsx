import { getProductsTable } from "@/modules/products/queries/getProductsTable.query";
import { ProductsTableClient } from "./products-table-client";
import { ListPageLayout } from "@/components/ui/ListPageLayout/ListPageLayout";
import { routes } from "@/lib/routes";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const sp = await searchParams;
  const { data, pagination } = await getProductsTable(sp);

  return (
    <ListPageLayout
      title="Productos"
      description="Administra el catálogo de productos."
      fabLabel="Nuevo producto"
      breadcrumbs={<Breadcrumbs items={[{ label: "Productos" }]} />}
      createRoute={routes.products.new()}
    >
      <ProductsTableClient data={data} pagination={pagination} />
    </ListPageLayout>
  );
}
