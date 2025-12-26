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
} from "@heroicons/react/16/solid";

function formatMoney(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toFixed(2)}`;
}

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
      cell: (v) => formatMoney(v),
      sortField: "total",
    },
    {
      header: "Total pagado",
      field: "paidTotal",
      sortable: false, // calculado
      cell: (v) => formatMoney(v),
    },
    {
      header: "Creado",
      field: "createdAt",
      sortable: true,
      cell: (v) => new Date(v).toLocaleString("es-MX"),
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
        if (e.type === "details") router.push(`/sales-notes/${e.row.id}`);
        if (e.type === "edit") router.push(`/sales-notes/${e.row.id}/edit`);
        if (e.type === "payment")
          router.push(`/sales-notes/${e.row.id}/payments/new`);
      }}
      searchPlaceholder="Buscar por folio o cliente…"
      pageSizeOptions={[10, 25, 50]}
      showPageSizeSelector
      initialSort={{ sortField: "createdAt", sortOrder: "desc" }}
    />
  );
}
