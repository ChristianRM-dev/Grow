"use client";

import { useRouter } from "next/navigation";

import { GenericPaginatedTable } from "@/components/ui/GenericPaginatedTable/GenericPaginatedTable";
import type {
  ColumnDef,
  TablePagination,
  TableActionDef,
} from "@/components/ui/GenericPaginatedTable/GenericPaginatedTable.types";
import type { ProductVariantRowDto } from "@/modules/products/queries/getProductsTable.query";
import { useTableUrlQuery } from "@/modules/shared/tables/useTableUrlQuery";

export function ProductsTableClient({
  data,
  pagination,
}: {
  data: ProductVariantRowDto[];
  pagination: TablePagination;
}) {
  const router = useRouter();
  const pushTableQuery = useTableUrlQuery();

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
    { header: "Color", field: "color", sortable: true, cell: (v) => v ?? "—" },
    {
      header: "Precio",
      field: "defaultPrice",
      sortable: true,
      cell: (v) => `$${v}`,
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
      cell: (v) => new Date(v).toLocaleDateString("es-MX"),
    },
  ];

  const actions: Array<TableActionDef<ProductVariantRowDto>> = [
    {
      type: "edit",
      label: "Editar",
      tooltip: "Editar producto",
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            fill="currentColor"
            d="M5 19h14v2H5zM15.7 5.3l3 3L9 18H6v-3zM18.4 4.6l-1-1a1.5 1.5 0 0 0-2.1 0l-1.1 1.1l3 3l1.2-1.1a1.5 1.5 0 0 0 0-2.1"
          />
        </svg>
      ),
    },
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
        if (e.type === "edit") {
          router.push(`/products/${e.row.id}/edit`);
        }
      }}
      searchPlaceholder="Buscar productos…"
      pageSizeOptions={[10, 25, 50]}
      showPageSizeSelector
      initialSort={{ sortField: "createdAt", sortOrder: "desc" }}
    />
  );
}
