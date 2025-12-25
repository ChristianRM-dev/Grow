"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { ProductVariantRowDto } from "@/modules/products/queries/getProductsTable.query";
import {
  ColumnDef,
  TablePagination,
  TableQuery,
} from "@/components/ui/GenericPaginatedTable/GenericPaginatedTable.types";
import { GenericPaginatedTable } from "@/components/ui/GenericPaginatedTable/GenericPaginatedTable";

export function ProductsTableClient({
  data,
  pagination,
}: {
  data: ProductVariantRowDto[];
  pagination: TablePagination;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

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
      // Since DTO is string, format as currency-ish without floating errors.
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
      sortField: "createdAt",
    },
  ];

  const onQueryChange = (q: TableQuery) => {
    const params = new URLSearchParams(sp.toString());

    params.set("page", String(q.pagination.page));
    params.set("pageSize", String(q.pagination.pageSize));

    if (q.sort) {
      params.set("sortField", q.sort.sortField);
      params.set("sortOrder", q.sort.sortOrder);
    } else {
      params.delete("sortField");
      params.delete("sortOrder");
    }

    if (q.search?.term) params.set("search", q.search.term);
    else params.delete("search");

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <GenericPaginatedTable<ProductVariantRowDto>
      data={data}
      columns={columns}
      pagination={pagination}
      loading={false}
      onQueryChange={onQueryChange}
      searchPlaceholder="Buscar productos…"
      initialSort={{ sortField: "createdAt", sortOrder: "desc" }}
    />
  );
}
