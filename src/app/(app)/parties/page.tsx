import { ListPageLayout } from "@/components/ui/ListPageLayout/ListPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { PartiesTableClient } from "./parties-table-client";
import { getPartiesTableQuery } from "@/modules/parties/queries/getPartiesTable.query";
import { routes } from "@/lib/routes";

export default async function PartiesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { data, pagination } = await getPartiesTableQuery(searchParams);

  return (
    <ListPageLayout
      title="Parties"
      description="Administra clientes y proveedores."
      fabLabel="Nuevo party"
      createRoute={routes.parties.new()}
      breadcrumbs={<Breadcrumbs items={[{ label: "Parties" }]} />}
    >
      <PartiesTableClient data={data} pagination={pagination} />
    </ListPageLayout>
  );
}
