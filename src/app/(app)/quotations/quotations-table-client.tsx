"use client";

import { useRouter } from "next/navigation";

import { GenericPaginatedTable } from "@/components/ui/GenericPaginatedTable/GenericPaginatedTable";
import type {
  ColumnDef,
  TableActionDef,
  TablePagination,
} from "@/components/ui/GenericPaginatedTable/GenericPaginatedTable.types";

import { useTableUrlQuery } from "@/modules/shared/tables/useTableUrlQuery";
import type { QuotationRowDto } from "@/modules/quotations/queries/getQuotationsTable.query";

import { EyeIcon, PencilSquareIcon } from "@heroicons/react/16/solid";
import { routes } from "@/lib/routes";
import { dateMX, money } from "@/modules/shared/utils/formatters";

export function QuotationsTableClient({
  data,
  pagination,
}: {
  data: QuotationRowDto[];
  pagination: TablePagination;
}) {
  const router = useRouter();
  const pushTableQuery = useTableUrlQuery();

  const columns: Array<ColumnDef<QuotationRowDto>> = [
    { header: "Folio", field: "folio", sortable: true },
    {
      header: "Contacto",
      field: "partyName",
      sortable: true,
      sortField: "partyName",
    },
    {
      header: "Total",
      field: "total",
      sortable: true,
      sortField: "total",
      cell: (v) => money(v),
    },
    {
      header: "Creado",
      field: "createdAt",
      sortable: true,
      sortField: "createdAt",
      cell: (v) => dateMX(v),
    },
  ];

  const actions: Array<TableActionDef<QuotationRowDto>> = [
    {
      type: "details",
      label: "Detalles",
      tooltip: "Ver detalles",
      icon: <EyeIcon className="h-5 w-5" />,
    },
    {
      type: "edit",
      label: "Editar",
      tooltip: "Editar cotización",
      icon: <PencilSquareIcon className="h-5 w-5" />,
    },
  ];

  return (
    <GenericPaginatedTable<QuotationRowDto>
      data={data}
      columns={columns}
      actions={actions}
      pagination={pagination}
      loading={false}
      onQueryChange={pushTableQuery}
      onAction={(e) => {
        switch (e.type) {
          case "details":
            router.push(routes.quotations.details(e.row.id));
            break;
          case "edit":
            router.push(routes.quotations.edit(e.row.id));
            break;
        }
      }}
      searchPlaceholder="Buscar por folio o contacto…"
      pageSizeOptions={[10, 25, 50]}
      showPageSizeSelector
      initialSort={{ sortField: "createdAt", sortOrder: "desc" }}
    />
  );
}
