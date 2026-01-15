// src/app/(app)/products/products-table-client.tsx
"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { GenericPaginatedTable } from "@/components/ui/GenericPaginatedTable/GenericPaginatedTable";
import type {
  ColumnDef,
  TablePagination,
  TableActionDef,
} from "@/components/ui/GenericPaginatedTable/GenericPaginatedTable.types";
import type { ProductVariantRowDto } from "@/modules/products/queries/getProductsTable.query";
import { useTableUrlQuery } from "@/modules/shared/tables/useTableUrlQuery";
import {
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/16/solid";
import { routes } from "@/lib/routes";
import { dateMX, money } from "@/modules/shared/utils/formatters";
import { useBlockingDialogs } from "@/components/ui/Dialogs";
import { softDeleteProductVariantAction } from "@/modules/products/actions/softDeleteProductVariant.action";
import { toggleProductVariantActiveAction } from "@/modules/products/actions/toggleProductVariantActive.action";

export function ProductsTableClient({
  data,
  pagination,
}: {
  data: ProductVariantRowDto[];
  pagination: TablePagination;
}) {
  const router = useRouter();
  const pushTableQuery = useTableUrlQuery();
  const dialogs = useBlockingDialogs();
  const [isPending, startTransition] = useTransition();

  // Toggle active flow
  const handleToggleActive = async (row: ProductVariantRowDto) => {
    const displayName = row.variantName
      ? `${row.speciesName} - ${row.variantName}`
      : row.speciesName;

    const newState = !row.isActive;
    const action = newState ? "activar" : "desactivar";
    const actionPast = newState ? "activado" : "desactivado";

    // Confirmation dialog
    const ok = await dialogs.confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} producto`,
      message: (
        <div className="space-y-3">
          <p>
            ¿Estás seguro de que deseas {action} el producto{" "}
            <strong>{displayName}</strong>?
          </p>
          {newState ? (
            <div className="alert alert-info">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="h-6 w-6 shrink-0 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm">
                El producto volverá a aparecer en el selector de productos al
                crear nuevas notas de venta y cotizaciones.
              </span>
            </div>
          ) : (
            <div className="alert alert-warning">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 shrink-0 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-sm">
                El producto ya no aparecerá en el selector de productos al crear
                nuevas notas de venta o cotizaciones. Las ventas existentes no
                se verán afectadas.
              </span>
            </div>
          )}
          <p className="text-sm opacity-70">
            Esta acción es reversible. Puedes{" "}
            {newState ? "desactivar" : "activar"} el producto cuando lo
            necesites.
          </p>
        </div>
      ),
      labels: {
        confirmText: action.charAt(0).toUpperCase() + action.slice(1),
        cancelText: "Cancelar",
      },
    });

    if (!ok) return;

    startTransition(async () => {
      try {
        const result = await toggleProductVariantActiveAction({
          id: row.id,
          isActive: newState,
        });
        router.refresh();

        await dialogs.success({
          title: `Producto ${actionPast}`,
          message: `El producto "${result.productName}" se ${actionPast} correctamente.`,
          labels: { confirmText: "Listo" },
        });
      } catch (err) {
        await dialogs.error({
          title: `No se pudo ${action}`,
          message:
            err instanceof Error
              ? err.message
              : `Ocurrió un error al ${action} el producto. Inténtalo de nuevo.`,
          details: err instanceof Error ? err.stack : String(err),
          labels: { confirmText: "Entendido" },
        });
      }
    });
  };

  // Delete flow
  const handleDeleteProduct = async (row: ProductVariantRowDto) => {
    const displayName = row.variantName
      ? `${row.speciesName} - ${row.variantName}`
      : row.speciesName;

    const ok = await dialogs.confirmDelete({
      resourceLabel: "producto",
      message: (
        <div className="space-y-2">
          <p>
            Se eliminará el producto <strong>{displayName}</strong>.
          </p>
          <p className="text-sm opacity-80">
            ⚠️ Esta acción no se puede deshacer. El producto no podrá ser usado
            en nuevas ventas o cotizaciones.
          </p>
          <p className="text-sm font-medium">
            Precio: {money(row.defaultPrice)}
          </p>
          {row.isActive && (
            <div className="alert alert-warning mt-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 shrink-0 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-sm">
                💡 Tip: Este producto está activo. Considera{" "}
                <strong>desactivarlo</strong> en lugar de eliminarlo si solo
                quieres pausar su uso temporalmente.
              </span>
            </div>
          )}
        </div>
      ),
      confirmText: "Eliminar permanentemente",
      cancelText: "Cancelar",
    });

    if (!ok) return;

    startTransition(async () => {
      try {
        const result = await softDeleteProductVariantAction({ id: row.id });
        router.refresh();

        await dialogs.success({
          title: "Eliminado",
          message: `El producto "${result.productName}" se eliminó correctamente.`,
          labels: { confirmText: "Listo" },
        });
      } catch (err) {
        await dialogs.error({
          title: "No se pudo eliminar",
          message:
            err instanceof Error
              ? err.message
              : "Ocurrió un error al eliminar el producto. Inténtalo de nuevo.",
          details: err instanceof Error ? err.stack : String(err),
          labels: { confirmText: "Entendido" },
        });
      }
    });
  };

  const columns: Array<ColumnDef<ProductVariantRowDto>> = [
    { header: "Especie", field: "speciesName", sortable: true },
    {
      header: "Variante",
      field: "variantName",
      sortable: true,
      cell: (v) => v ?? "—",
    },
    {
      header: "Bolsa",
      field: "bagSize",
      sortable: true,
      cell: (v) => v ?? "—",
    },
    {
      header: "Color",
      field: "color",
      sortable: true,
      cell: (v) => v ?? "—",
    },
    {
      header: "Precio",
      field: "defaultPrice",
      sortable: true,
      cell: (v) => money(v),
      sortField: "defaultPrice",
    },
    {
      header: "Activo",
      field: "isActive",
      sortable: true,
      cell: (v) => (
        <span className={`badge ${v ? "badge-success" : "badge-ghost"}`}>
          {v ? "Sí" : "No"}
        </span>
      ),
      sortField: "isActive",
    },
    {
      header: "Creado",
      field: "createdAt",
      sortable: true,
      cell: (v) => dateMX(v),
      sortField: "createdAt",
    },
  ];

  const actions: Array<TableActionDef<ProductVariantRowDto>> = [
    {
      type: "edit",
      label: "Editar",
      tooltip: "Editar producto",
      icon: <PencilSquareIcon className="h-5 w-5" />,
    },
    {
      type: "toggle-active",
      label: (row) => (row.isActive ? "Desactivar" : "Activar"),
      tooltip: (row) =>
        row.isActive
          ? "Desactivar producto (no aparecerá en nuevas ventas)"
          : "Activar producto (volverá a aparecer en nuevas ventas)",
      icon: (row) =>
        row.isActive ? (
          <EyeSlashIcon className="h-5 w-5" />
        ) : (
          <EyeIcon className="h-5 w-5" />
        ),
      disabled: () => isPending,
    },
    {
      type: "delete",
      label: "Eliminar",
      tooltip: "Eliminar permanentemente",
      icon: <TrashIcon className="h-5 w-5" />,
      disabled: () => isPending,
    } as unknown as TableActionDef<ProductVariantRowDto>,
  ];

  return (
    <GenericPaginatedTable<ProductVariantRowDto>
      data={data}
      columns={columns}
      actions={actions}
      pagination={pagination}
      loading={false}
      onQueryChange={pushTableQuery}
      onAction={(e) => {
        switch (e.type) {
          case "edit":
            router.push(routes.products.edit(e.row.id));
            break;
          case "toggle-active":
            void handleToggleActive(e.row);
            break;
          case "delete":
            void handleDeleteProduct(e.row);
            break;
        }
      }}
      searchPlaceholder="Buscar productos…"
      pageSizeOptions={[10, 25, 50]}
      showPageSizeSelector
      initialSort={{ sortField: "speciesName", sortOrder: "asc" }}
    />
  );
}
