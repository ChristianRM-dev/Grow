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
import { PencilSquareIcon } from "@heroicons/react/16/solid";
import { routes } from "@/lib/routes";
import { dateMX, money } from "@/modules/shared/utils/formatters";

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
          router.push(routes.products.edit(e.row.id));
        }
      }}
      searchPlaceholder="Buscar productos…"
      pageSizeOptions={[10, 25, 50]}
      showPageSizeSelector
      initialSort={{ sortField: "createdAt", sortOrder: "desc" }}
    />
  );
}
