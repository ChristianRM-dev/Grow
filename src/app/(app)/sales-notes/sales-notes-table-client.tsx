"use client";

import { useRouter } from "next/navigation";

import { GenericPaginatedTable } from "@/components/ui/GenericPaginatedTable/GenericPaginatedTable";
import type {
  ColumnDef,
  TableActionDef,
  TablePagination,
} from "@/components/ui/GenericPaginatedTable/GenericPaginatedTable.types";
import type { SalesNoteRowDto } from "@/modules/sales-notes/queries/getSalesNotesTable.query";
import { useTableUrlQuery } from "@/modules/shared/tables/useTableUrlQuery";

import {
  CurrencyDollarIcon,
  EyeIcon,
  PencilSquareIcon,
  DocumentIcon,
} from "@heroicons/react/16/solid";
import { routes } from "@/lib/routes";
import { dateMX, money } from "@/modules/shared/utils/formatters";

export function SalesNotesTableClient({
  data,
  pagination,
}: {
  data: SalesNoteRowDto[];
  pagination: TablePagination;
}) {
  const router = useRouter();
  const pushTableQuery = useTableUrlQuery();

  const columns: Array<ColumnDef<SalesNoteRowDto>> = [
    { header: "Folio", field: "folio", sortable: true },
    {
      header: "Cliente",
      field: "partyName",
      sortable: true,
      sortField: "partyName",
    },
    {
      header: "Total",
      field: "total",
      sortable: true,
      cell: (v) => money(v),
      sortField: "total",
    },
    {
      header: "Total pagado",
      field: "paidTotal",
      sortable: false, // calculado
      cell: (v) => money(v),
    },
    {
      header: "Creado",
      field: "createdAt",
      sortable: true,
      cell: (v) => dateMX(v),
      sortField: "createdAt",
    },
  ];

  const actions: Array<TableActionDef<SalesNoteRowDto>> = [
    {
      type: "details",
      label: "Detalles",
      tooltip: "Ver detalles",
      icon: <EyeIcon className="h-5 w-5" />,
    },
    {
      type: "edit",
      label: "Editar",
      tooltip: "Editar nota de venta",
      icon: <PencilSquareIcon className="h-5 w-5" />,
    },
    {
      type: "payment",
      label: "Agregar pago",
      tooltip: "Registrar pago",
      icon: <CurrencyDollarIcon className="h-5 w-5" />,
      disabled: (row) => row.isFullyPaid,
    },
    {
      type: "pdf",
      label: "Ver PDF",
      tooltip: "Ver PDF",
      icon: <DocumentIcon className="h-5 w-5" />,
      disabled: (row) => row.isFullyPaid,
    },
  ];

  return (
    <GenericPaginatedTable<SalesNoteRowDto>
      data={data}
      columns={columns}
      actions={actions}
      pagination={pagination}
      loading={false}
      onQueryChange={pushTableQuery}
      onAction={(e) => {
        switch (e.type) {
          case "details":
            router.push(routes.salesNotes.details(e.row.id));
            break;
          case "edit":
            router.push(routes.salesNotes.edit(e.row.id));
            break;
          case "payment":
            router.push(routes.salesNotes.payments.new(e.row.id));
            break;
          case "pdf": {
            const url = routes.salesNotes.pdf(e.row.id); // /sales-notes/[id]/pdf (route.ts)
            window.open(url, "_blank", "noopener,noreferrer");
            break;
          }
        }
      }}
      searchPlaceholder="Buscar por folio o cliente…"
      pageSizeOptions={[10, 25, 50]}
      showPageSizeSelector
      initialSort={{ sortField: "createdAt", sortOrder: "desc" }}
    />
  );
}
