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
import { dateMX, money } from "@/modules/shared/utils/formatters";

import { useBlockingDialogs } from "@/components/ui/Dialogs";
import { softDeleteSalesNoteAction } from "@/modules/sales-notes/actions/softDeleteSalesNote.action";

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

  // Delete flow isolated and reusable
  const handleDeleteSalesNote = async (row: SalesNoteRowDto) => {
    // 1) Open modal OUTSIDE of transition so it renders immediately
    const ok = await dialogs.confirmDelete({
      resourceLabel: "nota de venta",
      message: (
        <div className="space-y-2">
          <p>
            Se eliminará la nota de venta <strong>{row.folio}</strong> del
            cliente <strong>{row.partyName}</strong>.
          </p>
          <p className="text-sm opacity-80">
            Los pagos relacionados y los movimientos del libro mayor también se
            marcarán como eliminados.
          </p>
          <p className="text-sm font-medium">Total: {money(row.total)}</p>
        </div>
      ),
      confirmText: "Eliminar",
      cancelText: "Cancelar",
    });

    if (!ok) return;

    // 2) Only the server action + refresh goes into transition
    startTransition(async () => {
      try {
        const result = await softDeleteSalesNoteAction({ id: row.id });
        router.refresh();

        const paymentsMsg =
          result.deletedPaymentsCount && result.deletedPaymentsCount > 0
            ? ` Se eliminaron ${result.deletedPaymentsCount} pago(s) relacionado(s).`
            : "";

        await dialogs.success({
          title: "Eliminado",
          message: `La nota de venta se eliminó correctamente.${paymentsMsg}`,
          labels: { confirmText: "Listo" },
        });
      } catch (err) {
        await dialogs.error({
          title: "No se pudo eliminar",
          message:
            "Ocurrió un error al eliminar la nota de venta. Inténtalo de nuevo.",
          details: err instanceof Error ? err.message : String(err),
          labels: { confirmText: "Entendido" },
        });
      }
    });
  };

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
    },
    {
      type: "delete",
      label: "Eliminar",
      tooltip: "Eliminar nota de venta",
      icon: <TrashIcon className="h-5 w-5" />,
      disabled: () => isPending,
    } as unknown as TableActionDef<SalesNoteRowDto>,
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
            const url = routes.salesNotes.pdf(e.row.id);
            window.open(url, "_blank", "noopener,noreferrer");
            break;
          }
          case "delete":
            // no transition wrapper here
            void handleDeleteSalesNote(e.row);
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
