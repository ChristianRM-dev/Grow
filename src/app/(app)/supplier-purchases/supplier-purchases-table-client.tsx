"use client";

import { useRouter } from "next/navigation";

import { GenericPaginatedTable } from "@/components/ui/GenericPaginatedTable/GenericPaginatedTable";
import type {
  ColumnDef,
  TableActionDef,
  TablePagination,
} from "@/components/ui/GenericPaginatedTable/GenericPaginatedTable.types";

import { useTableUrlQuery } from "@/modules/shared/tables/useTableUrlQuery";
import { dateMX, money } from "@/modules/shared/utils/formatters";
import { routes } from "@/lib/routes";

import type { SupplierPurchaseRowDto } from "@/modules/supplier-purchases/queries/getSupplierPurchasesTable.query";

import {
  CurrencyDollarIcon,
  EyeIcon,
  PencilSquareIcon,
} from "@heroicons/react/16/solid";

export function SupplierPurchasesTableClient({
  data,
  pagination,
}: {
  data: SupplierPurchaseRowDto[];
  pagination: TablePagination;
}) {
  const router = useRouter();
  const pushTableQuery = useTableUrlQuery();

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
      cell: (v) => money(v),
    },
    {
      header: "Creado",
      field: "createdAt",
      sortable: true,
      sortField: "createdAt",
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
        }
      }}
      searchPlaceholder="Buscar por proveedor, folio o notas…"
      pageSizeOptions={[10, 25, 50]}
      showPageSizeSelector
      initialSort={{ sortField: "createdAt", sortOrder: "desc" }}
    />
  );
}
