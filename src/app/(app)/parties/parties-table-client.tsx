"use client";

import { useRouter } from "next/navigation";

import { GenericPaginatedTable } from "@/components/ui/GenericPaginatedTable/GenericPaginatedTable";
import type {
  ColumnDef,
  TableActionDef,
  TablePagination,
} from "@/components/ui/GenericPaginatedTable/GenericPaginatedTable.types";

import type { PartyRowDto } from "@/modules/parties/queries/getPartiesTable.query";
import { useTableUrlQuery } from "@/modules/shared/tables/useTableUrlQuery";
import { dateMX, phoneMX } from "@/modules/shared/utils/formatters";
import { routes } from "@/lib/routes";

import { EyeIcon, PencilSquareIcon } from "@heroicons/react/16/solid";

export function PartiesTableClient({
  data,
  pagination,
}: {
  data: PartyRowDto[];
  pagination: TablePagination;
}) {
  const router = useRouter();
  const pushTableQuery = useTableUrlQuery();

  const columns: Array<ColumnDef<PartyRowDto>> = [
    { header: "Nombre", field: "name", sortable: true, sortField: "name" },
    {
      header: "Teléfono",
      field: "phone",
      sortable: true,
      sortField: "phone",
      cell: (v) => phoneMX(v),
    },
    {
      header: "Notas",
      field: "notes",
      sortable: false,
      cell: (v) => (String(v ?? "").trim() ? String(v) : "—"),
    },
    {
      header: "Creado",
      field: "createdAt",
      sortable: true,
      sortField: "createdAt",
      cell: (v) => dateMX(v),
    },
    {
      header: "Es cliente",
      field: "isCustomer",
      sortable: false,
      cell: (v) =>
        v ? (
          <span className="badge badge-success">Sí</span>
        ) : (
          <span className="badge">No</span>
        ),
    },
    {
      header: "Es proveedor",
      field: "isSupplier",
      sortable: false,
      cell: (v) =>
        v ? (
          <span className="badge badge-success">Sí</span>
        ) : (
          <span className="badge">No</span>
        ),
    },
  ];

  const actions: Array<TableActionDef<PartyRowDto>> = [
    {
      type: "details",
      label: "Detalles",
      tooltip: "Ver detalles",
      icon: <EyeIcon className="h-5 w-5" />,
    },
    {
      type: "edit",
      label: "Editar",
      tooltip: "Editar party",
      icon: <PencilSquareIcon className="h-5 w-5" />,
    },
  ];

  return (
    <GenericPaginatedTable<PartyRowDto>
      data={data}
      columns={columns}
      actions={actions}
      pagination={pagination}
      loading={false}
      onQueryChange={pushTableQuery}
      onAction={(e) => {
        switch (e.type) {
          case "details":
            router.push(routes.parties.details(e.row.id));
            break;
          case "edit":
            router.push(routes.parties.edit(e.row.id));
            break;
        }
      }}
      searchPlaceholder="Buscar por nombre, teléfono o notas…"
      pageSizeOptions={[10, 25, 50]}
      showPageSizeSelector
      initialSort={{ sortField: "createdAt", sortOrder: "desc" }}
    />
  );
}
