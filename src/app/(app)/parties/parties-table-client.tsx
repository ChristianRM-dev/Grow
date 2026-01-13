"use client";

import React, { useTransition } from "react";
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

import {
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";

import { useBlockingDialogs } from "@/components/ui/Dialogs";
import { softDeletePartyAction } from "@/modules/parties/actions/softDeleteParty.action";

export function PartiesTableClient({
  data,
  pagination,
}: {
  data: PartyRowDto[];
  pagination: TablePagination;
}) {
  const router = useRouter();
  const pushTableQuery = useTableUrlQuery();
  const dialogs = useBlockingDialogs();
  const [isPending, startTransition] = useTransition();

  // Keep delete flow isolated and reusable.
  const handleDeleteParty = async (row: PartyRowDto) => {
    // 1) Open modal OUTSIDE of transition so it renders immediately.
    const ok = await dialogs.confirmDelete({
      resourceLabel: "contacto",
      message: (
        <div className="space-y-2">
          <p>
            Se eliminará <strong>{row.name}</strong> de la lista de contactos.
          </p>
          <p className="text-sm opacity-80">
            Sus notas de venta, compras, pagos y documentos relacionados{" "}
            <strong>seguirán disponibles</strong> para consulta.
          </p>
        </div>
      ),
      confirmText: "Eliminar",
      cancelText: "Cancelar",
    });

    if (!ok) return;

    // 2) Only the server action + refresh goes into transition.
    startTransition(async () => {
      try {
        await softDeletePartyAction({ id: row.id });
        router.refresh();

        await dialogs.success({
          title: "Eliminado",
          message: "El contacto se eliminó correctamente.",
          labels: { confirmText: "Listo" },
        });
      } catch (err) {
        await dialogs.error({
          title: "No se pudo eliminar",
          message:
            "Ocurrió un error al eliminar el contacto. Inténtalo de nuevo.",
          details: err instanceof Error ? err.message : String(err),
          labels: { confirmText: "Entendido" },
        });
      }
    });
  };

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
      tooltip: "Editar contacto",
      icon: <PencilSquareIcon className="h-5 w-5" />,
    },
    {
      type: "delete",
      label: "Eliminar",
      tooltip: "Eliminar contacto",
      icon: <TrashIcon className="h-5 w-5" />,
      disabled: () => isPending,
    } as unknown as TableActionDef<PartyRowDto>,
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
          case "delete":
            // no transition wrapper here
            void handleDeleteParty(e.row);
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
