"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";

import { GenericPaginatedTable } from "@/components/ui/GenericPaginatedTable/GenericPaginatedTable";
import type {
  ColumnDef,
  TableActionDef,
  TablePagination,
} from "@/components/ui/GenericPaginatedTable/GenericPaginatedTable.types";

import { useTableUrlQuery } from "@/modules/shared/tables/useTableUrlQuery";
import type { QuotationRowDto } from "@/modules/quotations/queries/getQuotationsTable.query";
import { softDeleteQuotationAction } from "@/modules/quotations/actions/softDeleteQuotation.action";

import {
  DocumentIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";
import { routes } from "@/lib/routes";
import { dateMX, moneyMX } from "@/modules/shared/utils/formatters";
import { useBlockingDialogs } from "@/components/ui/Dialogs";

export function QuotationsTableClient({
  data,
  pagination,
}: {
  data: QuotationRowDto[];
  pagination: TablePagination;
}) {
  const router = useRouter();
  const pushTableQuery = useTableUrlQuery();
  const dialogs = useBlockingDialogs();
  const [isPending, startTransition] = useTransition();

  const handleDeleteQuotation = async (row: QuotationRowDto) => {
    const ok = await dialogs.confirmDelete({
      resourceLabel: "cotización",
      message: (
        <div className="space-y-2">
          <p>
            Se eliminará la cotización <strong>{row.folio}</strong>.
          </p>
          <p className="text-sm opacity-80">
            Esta acción marcará la cotización como convertida y la ocultará de
            las listas activas.
          </p>
        </div>
      ),
      confirmText: "Eliminar",
      cancelText: "Cancelar",
    });

    if (!ok) return;

    startTransition(async () => {
      try {
        await softDeleteQuotationAction({ id: row.id });
        router.refresh();

        await dialogs.success({
          title: "Eliminada",
          message: "La cotización se eliminó correctamente.",
          labels: { confirmText: "Listo" },
        });
      } catch (err) {
        await dialogs.error({
          title: "No se pudo eliminar",
          message:
            "Ocurrió un error al eliminar la cotización. Inténtalo de nuevo.",
          details: err instanceof Error ? err.message : String(err),
          labels: { confirmText: "Entendido" },
        });
      }
    });
  };

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
      cell: (v) => moneyMX(v),
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
    {
      type: "pdf",
      label: "Ver PDF",
      tooltip: "Ver PDF",
      icon: <DocumentIcon className="h-5 w-5" />,
    },
    {
      type: "delete",
      label: "Eliminar",
      tooltip: "Eliminar cotización",
      icon: <TrashIcon className="h-5 w-5" />,
      disabled: () => isPending,
    } as unknown as TableActionDef<QuotationRowDto>,
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
          case "pdf": {
            const url = routes.quotations.pdf(e.row.id); // /sales-notes/[id]/pdf (route.ts)
            window.open(url, "_blank", "noopener,noreferrer");
            break;
          }
          case "delete":
            void handleDeleteQuotation(e.row);
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
