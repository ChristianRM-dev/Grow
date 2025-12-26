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

function statusBadge(status: string) {
  const s = String(status).toUpperCase();

  // Adjust to your enum values if needed
  const className =
    s === "PAID"
      ? "badge-success"
      : s === "CANCELLED"
      ? "badge-error"
      : s === "DRAFT"
      ? "badge-ghost"
      : "badge-neutral";

  const label =
    s === "PAID"
      ? "Pagada"
      : s === "CANCELLED"
      ? "Cancelada"
      : s === "DRAFT"
      ? "Borrador"
      : status;

  return <span className={`badge ${className}`}>{label}</span>;
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
      header: "Estado",
      field: "status",
      sortable: true,
      cell: (v) => statusBadge(v),
    },
    {
      header: "Creado",
      field: "createdAt",
      sortable: true,
      cell: (v) => new Date(v).toLocaleString("es-MX"),
    },
    {
      header: "Subtotal",
      field: "subtotal",
      sortable: true,
      cell: (v) => formatMoney(v),
      sortField: "subtotal",
    },
    {
      header: "Descuento",
      field: "discountTotal",
      sortable: true,
      cell: (v) => formatMoney(v),
      sortField: "discountTotal",
    },
    {
      header: "Total",
      field: "total",
      sortable: true,
      cell: (v) => formatMoney(v),
      sortField: "total",
    },
  ];

  const actions: Array<TableActionDef<SalesNoteRowDto>> = [
    {
      type: "view",
      label: "Ver",
      tooltip: "Ver nota de venta",
      icon: <EyeIcon className="h-5 w-5" />,
    },
    {
      type: "edit",
      label: "Editar",
      tooltip: "Editar nota de venta",
      icon: <PencilSquareIcon className="h-5 w-5" />,
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
        if (e.type === "view") {
          router.push(`/sales-notes/${e.row.id}`);
        }
        if (e.type === "edit") {
          router.push(`/sales-notes/${e.row.id}/edit`);
        }
      }}
      searchPlaceholder="Buscar por folio o cliente…"
      pageSizeOptions={[10, 25, 50]}
      showPageSizeSelector
      initialSort={{ sortField: "createdAt", sortOrder: "desc" }}
    />
  );
}
