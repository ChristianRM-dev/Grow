"use client";

import { GenericPaginatedTable } from "@/components/ui/GenericPaginatedTable/GenericPaginatedTable";
import type {
  ColumnDef,
  TablePagination,
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

  return (
    <GenericPaginatedTable<ProductVariantRowDto>
      data={data}
      columns={columns}
      pagination={pagination}
      loading={false}
      onQueryChange={pushTableQuery}
      searchPlaceholder="Buscar productos…"
      pageSizeOptions={[10, 25, 50]}
      showPageSizeSelector
      initialSort={{ sortField: "createdAt", sortOrder: "desc" }}
    />
  );
}
