import { getSalesNotesTableQuery } from "@/modules/sales-notes/queries/getSalesNotesTable.query";
import { ListPageLayout } from "@/components/ui/ListPageLayout/ListPageLayout";
import { SalesNotesTableClient } from "./sales-notes-table-client";

export default async function SalesNotesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { data, pagination } = await getSalesNotesTableQuery(searchParams);

  return (
    <ListPageLayout
      title="Notas de venta"
      description="Administra el catálogo de notas de venta."
      fabLabel="Nueva nota de venta"
      createRoute="/sales-notes/new"
    >
      <SalesNotesTableClient data={data} pagination={pagination} />
    </ListPageLayout>
  );
}
