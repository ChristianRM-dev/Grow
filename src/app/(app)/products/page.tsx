import { getProductsTable } from "@/modules/products/queries/getProductsTable.query";
import { ProductsTableClient } from "./products-table-client";

export const dynamic = "force-dynamic"; // ensure fresh render per navigation

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams; // ✅ Next 15: searchParams is a Promise
  const result = await getProductsTable(sp);

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
