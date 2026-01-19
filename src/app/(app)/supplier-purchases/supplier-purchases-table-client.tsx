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
import { dateMX, moneyMX } from "@/modules/shared/utils/formatters";
import { routes } from "@/lib/routes";
import type { SupplierPurchaseRowDto } from "@/modules/supplier-purchases/queries/getSupplierPurchasesTable.query";

import {
  CurrencyDollarIcon,
  DocumentIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";

import { useBlockingDialogs } from "@/components/ui/Dialogs";
import { softDeleteSupplierPurchaseAction } from "@/modules/supplier-purchases/actions/softDeleteSupplierPurchase.action";

export function SupplierPurchasesTableClient({
  data,
  pagination,
}: {
  data: SupplierPurchaseRowDto[];
  pagination: TablePagination;
}) {
  const router = useRouter();
  const pushTableQuery = useTableUrlQuery();
  const dialogs = useBlockingDialogs();
  const [isPending, startTransition] = useTransition();

  // Delete flow isolated and reusable
  const handleDeletePurchase = async (row: SupplierPurchaseRowDto) => {
    // 1) Open modal OUTSIDE of transition so it renders immediately
    const ok = await dialogs.confirmDelete({
      resourceLabel: "compra",
      message: (
        <div className="space-y-2">
          <p>
            Se eliminará la compra <strong>{row.supplierFolio}</strong> del
            proveedor <strong>{row.supplierName}</strong>.
          </p>
          <p className="text-sm opacity-80">
            Los pagos relacionados y los movimientos relacionados también se
            marcarán como eliminados.
          </p>
          <p className="text-sm font-medium">Total: {moneyMX(row.total)}</p>
        </div>
      ),
      confirmText: "Eliminar",
      cancelText: "Cancelar",
    });

    if (!ok) return;

    // 2) Only the server action + refresh goes into transition
    startTransition(async () => {
      try {
        const result = await softDeleteSupplierPurchaseAction({ id: row.id });
        router.refresh();

        const paymentsMsg =
          result.deletedPaymentsCount && result.deletedPaymentsCount > 0
            ? ` Se eliminaron ${result.deletedPaymentsCount} pago(s) relacionado(s).`
            : "";

        await dialogs.success({
          title: "Eliminado",
          message: `La compra se eliminó correctamente.${paymentsMsg}`,
          labels: { confirmText: "Listo" },
        });
      } catch (err) {
        await dialogs.error({
          title: "No se pudo eliminar",
          message:
            "Ocurrió un error al eliminar la compra. Inténtalo de nuevo.",
          details: err instanceof Error ? err.message : String(err),
          labels: { confirmText: "Entendido" },
        });
      }
    });
  };

  const columns: Array<ColumnDef<SupplierPurchaseRowDto>> = [
    {
      header: "Proveedor",
      field: "supplierName",
      sortable: true,
      sortField: "supplierName",
    },
    {
      header: "Folio",
      field: "supplierFolio",
      sortable: true,
      sortField: "supplierFolio",
    },
    {
      header: "Total",
      field: "total",
      sortable: true,
      sortField: "total",
      cell: (v) => moneyMX(v),
    },
    {
      header: "Cuando",
      field: "occurredAt",
      sortable: true,
      sortField: "occurredAt",
      cell: (v) => dateMX(v),
    },
  ];

  const actions: Array<TableActionDef<SupplierPurchaseRowDto>> = [
    {
      type: "details",
      label: "Detalles",
      tooltip: "Ver detalles",
      icon: <EyeIcon className="h-5 w-5" />,
    },
    {
      type: "edit",
      label: "Editar",
      tooltip: "Editar compra",
      icon: <PencilSquareIcon className="h-5 w-5" />,
    },
    {
      type: "payment",
      label: "Registrar pago",
      tooltip: "Agregar pago",
      icon: <CurrencyDollarIcon className="h-5 w-5" />,
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
      tooltip: "Eliminar compra",
      icon: <TrashIcon className="h-5 w-5" />,
      disabled: () => isPending,
    } as unknown as TableActionDef<SupplierPurchaseRowDto>,
  ];

  return (
    <GenericPaginatedTable<SupplierPurchaseRowDto>
      data={data}
      columns={columns}
      actions={actions}
      pagination={pagination}
      loading={false}
      onQueryChange={pushTableQuery}
      onAction={(e) => {
        switch (e.type) {
          case "details":
            router.push(routes.supplierPurchases.details(e.row.id));
            break;
          case "edit":
            router.push(routes.supplierPurchases.edit(e.row.id));
            break;
          case "payment":
            router.push(routes.supplierPurchases.payments.new(e.row.id));
            break;
          case "pdf": {
            const url = routes.supplierPurchases.pdf(e.row.id);
            window.open(url, "_blank", "noopener,noreferrer");
            break;
          }
          case "delete":
            // no transition wrapper here
            void handleDeletePurchase(e.row);
            break;
        }
      }}
      searchPlaceholder="Buscar por proveedor, folio o notas…"
      pageSizeOptions={[10, 25, 50]}
      showPageSizeSelector
      initialSort={{ sortField: "createdAt", sortOrder: "desc" }}
    />
  );
}
