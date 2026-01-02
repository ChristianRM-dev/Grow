import { ListPageLayout } from "@/components/ui/ListPageLayout/ListPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { routes } from "@/lib/routes";

import { getQuotationsTableQuery } from "@/modules/quotations/queries/getQuotationsTable.query";
import { QuotationsTableClient } from "./quotations-table-client";

export const dynamic = "force-dynamic";
type QuotationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function QuotationsPage({ searchParams }: QuotationsPageProps) {
  const sp = await searchParams;
  const { data, pagination } = await getQuotationsTableQuery(sp);

  return (
    <ListPageLayout
      title="Cotizaciones"
      description="Administra el catálogo de cotizaciones."
      breadcrumbs={<Breadcrumbs items={[{ label: "Cotizaciones" }]} />}
      fabLabel="Nueva cotización"
      createRoute={routes.quotations.new()}
    >
      <QuotationsTableClient data={data} pagination={pagination} />
    </ListPageLayout>
  );
}
