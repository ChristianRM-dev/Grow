import { getSalesNotesTableQuery } from "@/modules/sales-notes/queries/getSalesNotesTable.query";
import { ListPageLayout } from "@/components/ui/ListPageLayout/ListPageLayout";
import { SalesNotesTableClient } from "./sales-notes-table-client";
import { routes } from "@/lib/routes";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";

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
      createRoute={routes.salesNotes.new()}
      breadcrumbs={<Breadcrumbs items={[{ label: "Notas de venta" }]} />}
    >
      <SalesNotesTableClient data={data} pagination={pagination} />
    </ListPageLayout>
  );
}
