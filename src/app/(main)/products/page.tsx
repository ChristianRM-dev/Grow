import { getProductsTable } from "@/modules/products/queries/getProductsTable.query";
import { ProductsTableClient } from "./products-table-client";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const result = await getProductsTable(searchParams);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Productos</h1>

      <div className="mt-4">
        <ProductsTableClient
          data={result.data}
          pagination={result.pagination}
        />
      </div>
    </div>
  );
}
