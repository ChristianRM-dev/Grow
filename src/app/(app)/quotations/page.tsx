import { ListPageLayout } from "@/components/ui/ListPageLayout/ListPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { routes } from "@/lib/routes";

import { getQuotationsTableQuery } from "@/modules/quotations/queries/getQuotationsTable.query";
import { QuotationsTableClient } from "./quotations-table-client";

export const dynamic = "force-dynamic";

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { data, pagination } = await getQuotationsTableQuery(searchParams);

  return (
    <ListPageLayout
      title="Cotizaciones"
      description="Administra el catálogo de cotizaciones."
      breadcrumbs={<Breadcrumbs items={[{ label: "Cotizaciones" }]} />}
      // Si aún no tienes create, déjalo comentado por ahora:
      // fabLabel="Nueva cotización"
      // createRoute={routes.quotations.new()}
    >
      <QuotationsTableClient data={data} pagination={pagination} />
    </ListPageLayout>
  );
}
