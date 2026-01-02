import { ListPageLayout } from "@/components/ui/ListPageLayout/ListPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { PartiesTableClient } from "./parties-table-client";
import { getPartiesTableQuery } from "@/modules/parties/queries/getPartiesTable.query";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

type PartiesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PartiesPage({ searchParams }: PartiesPageProps) {
  const sp = await searchParams;
  const { data, pagination } = await getPartiesTableQuery(sp);

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
