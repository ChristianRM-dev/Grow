// src/app/(app)/sales-notes/sales-notes-table-client.tsx
"use client";

import React, { useTransition } from "react";
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
  TrashIcon,
} from "@heroicons/react/16/solid";
import { routes } from "@/lib/routes";
import { dateMX, moneyMX } from "@/modules/shared/utils/formatters";

import { useBlockingDialogs } from "@/components/ui/Dialogs";
import { toggleSalesNoteActiveAction } from "@/modules/sales-notes/actions/toggleSalesNoteActive.action";

function getStatusLabel(status: SalesNoteRowDto["status"]) {
  switch (status) {
    case "DRAFT":
      return "Borrador";
    case "CONFIRMED":
      return "Confirmada";
    case "CANCELLED":
      return "Cancelada";
    default:
      return "—";
  }
}

function getStatusBadgeClass(status: SalesNoteRowDto["status"]) {
  switch (status) {
    case "DRAFT":
      return "badge badge-warning";
    case "CONFIRMED":
      return "badge badge-success";
    case "CANCELLED":
      return "badge badge-error";
    default:
      return "badge";
  }
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
  const dialogs = useBlockingDialogs();
  const [isPending, startTransition] = useTransition();

  const handleToggleSalesNoteActive = async (row: SalesNoteRowDto) => {
    const isCurrentlyCancelled = row.status === "CANCELLED";
    const nextIsActive = isCurrentlyCancelled; // if cancelled -> activate, else -> deactivate

    const actionLabel = nextIsActive ? "Activar" : "Desactivar";

    const ok = await dialogs.confirmDelete({
      resourceLabel: "nota de venta",
      message: (
        <div className="space-y-2">
          <p>
            {nextIsActive ? (
              <>
                Se activará la nota de venta <strong>{row.folio}</strong> del
                cliente <strong>{row.partyName}</strong>.
              </>
            ) : (
              <>
                Se desactivará la nota de venta <strong>{row.folio}</strong> del
                cliente <strong>{row.partyName}</strong>.
              </>
            )}
          </p>

          {!nextIsActive ? (
            <>
              <p className="text-sm opacity-80">
                La nota seguirá visible en las listas, pero quedará marcada como{" "}
                <strong>Cancelada</strong> y no permitirá registrar pagos.
              </p>
              <p className="text-sm opacity-80">
                Los pagos relacionados y los movimientos del libro mayor se
                marcarán como eliminados para que no afecten los saldos.
              </p>
            </>
          ) : (
            <p className="text-sm opacity-80">
              La nota volverá a estado <strong>Confirmada</strong>. Los pagos
              previamente anulados no se restauran automáticamente.
            </p>
          )}

          <p className="text-sm font-medium">Total: {moneyMX(row.total)}</p>
        </div>
      ),
      confirmText: actionLabel,
      cancelText: "Cancelar",
    });

    if (!ok) return;

    startTransition(async () => {
      try {
        await toggleSalesNoteActiveAction({
          id: row.id,
          isActive: nextIsActive,
        });
        router.refresh();

        await dialogs.success({
          title: nextIsActive ? "Activada" : "Desactivada",
          message: nextIsActive
            ? "La nota de venta se activó correctamente."
            : "La nota de venta se desactivó correctamente (Cancelada).",
          labels: { confirmText: "Listo" },
        });
      } catch (err) {
        await dialogs.error({
          title: "No se pudo actualizar",
          message:
            "Ocurrió un error al actualizar el estado de la nota de venta. Inténtalo de nuevo.",
          details: err instanceof Error ? err.message : String(err),
          labels: { confirmText: "Entendido" },
        });
      }
    });
  };

  const columns: Array<ColumnDef<SalesNoteRowDto>> = [
    { header: "Folio", field: "folio", sortable: true },
    {
      header: "Estado",
      field: "status",
      sortable: true,
      cell: (v) => (
        <span className={getStatusBadgeClass(v)}>{getStatusLabel(v)}</span>
      ),
      sortField: "status",
    },
    {
      header: "Cliente",
      field: "partyName",
      sortable: true,
      sortField: "partyName",
      cell: (v, row) => (
        <div className="space-y-1">
          <div>{v}</div>
          {row.status === "CANCELLED" ? (
            <div className="text-xs opacity-70">Esta nota está desactivada</div>
          ) : null}
        </div>
      ),
    },
    {
      header: "Total",
      field: "total",
      sortable: true,
      cell: (v) => moneyMX(v),
      sortField: "total",
    },
    {
      header: "Total pagado",
      field: "paidTotal",
      sortable: false,
      cell: (v) => moneyMX(v),
    },
    {
      header: "Creado",
      field: "createdAt",
      sortable: true,
      cell: (v) => dateMX(v),
      sortField: "createdAt",
    },
  ];

  // IMPORTANT: keep the first 3 actions inline (details, edit, pdf).
  // The rest will go into the "Más" menu via actionsMenu.inlineCount.
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
      disabled: (row) => row.status === "CANCELLED",
    },
    {
      type: "pdf",
      label: "Ver PDF",
      tooltip: "Ver PDF",
      icon: <DocumentIcon className="h-5 w-5" />,
    },
    {
      type: "payment",
      label: "Agregar pago",
      tooltip: "Registrar pago",
      icon: <CurrencyDollarIcon className="h-5 w-5" />,
      disabled: (row) => row.isFullyPaid || row.status === "CANCELLED",
    },
    {
      type: "toggleActive",
      label: (row) => (row.status === "CANCELLED" ? "Activar" : "Desactivar"),
      tooltip: "Activar o desactivar la nota de venta",
      icon: <TrashIcon className="h-5 w-5" />,
      disabled: () => isPending,
    },
  ];

  return (
    <GenericPaginatedTable<SalesNoteRowDto>
      data={data}
      columns={columns}
      actions={actions}
      actionsMenu={{ inlineCount: 3, menuLabel: "Más acciones" }}
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
            const url = routes.salesNotes.pdf(e.row.id);
            window.open(url, "_blank", "noopener,noreferrer");
            break;
          }
          case "toggleActive":
            void handleToggleSalesNoteActive(e.row);
            break;
        }
      }}
      searchPlaceholder="Buscar por folio o cliente…"
      pageSizeOptions={[10, 25, 50]}
      showPageSizeSelector
      initialSort={{ sortField: "createdAt", sortOrder: "desc" }}
    />
  );
}
