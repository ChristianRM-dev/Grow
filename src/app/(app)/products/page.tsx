import { getProductsTable } from "@/modules/products/queries/getProductsTable.query";
import { ProductsTableClient } from "./products-table-client";
import { ListPageLayout } from "@/components/ui/ListPageLayout/ListPageLayout";

export const dynamic = "force-dynamic"; // ensure fresh render per navigation

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const result = await getProductsTable(sp);

  return (
    <ListPageLayout
      title="Productos"
      description="Administra el catálogo de productos."
      fabLabel="Nuevo producto"
      createRoute="/products/new"
    >
      <ProductsTableClient data={result.data} pagination={result.pagination} />
    </ListPageLayout>
  );
}
