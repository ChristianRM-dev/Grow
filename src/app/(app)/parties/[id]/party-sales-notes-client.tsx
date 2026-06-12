"use client";

import React, { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { GenericPaginatedTable } from "@/components/ui/GenericPaginatedTable/GenericPaginatedTable";
import type {
  ColumnDef,
  TableActionDef,
  TablePagination,
} from "@/components/ui/GenericPaginatedTable/GenericPaginatedTable.types";
import { routes } from "@/lib/routes";
import { renderPaymentStatusCell } from "@/modules/shared/tables/tableCellFormatters";
import { usePrefixedTableUrlQuery } from "@/modules/shared/tables/usePrefixedTableUrlQuery";
import { dateMX, moneyMX } from "@/modules/shared/utils/formatters";
import {
  PARTY_SALES_NOTES_QUERY_KEYS,
  PARTY_SALES_NOTES_QUERY_PREFIX,
  type PartySalesNotePaymentStatus,
  type PartySalesNoteRowDto,
  type PartySalesNotesQuery,
} from "@/modules/parties/queries/getPartySalesNotesTable.query";

import { DocumentIcon, EyeIcon } from "@heroicons/react/16/solid";

function setParam(params: URLSearchParams, key: string, value: string) {
  const trimmed = value.trim();
  if (trimmed) params.set(key, trimmed);
  else params.delete(key);
}

export function PartySalesNotesClient({
  data,
  pagination,
  query,
}: {
  data: PartySalesNoteRowDto[];
  pagination: TablePagination;
  query: PartySalesNotesQuery;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pushTableQuery = usePrefixedTableUrlQuery(
    PARTY_SALES_NOTES_QUERY_PREFIX,
  );

  const [paymentStatus, setPaymentStatus] = useState<PartySalesNotePaymentStatus>(
    query.paymentStatus,
  );
  const [from, setFrom] = useState(query.from);
  const [to, setTo] = useState(query.to);

  const columns: Array<ColumnDef<PartySalesNoteRowDto>> = useMemo(
    () => [
      {
        header: "Folio",
        field: "folio",
        sortable: true,
        sortField: "folio",
      },
      {
        header: "Creada",
        field: "createdAt",
        sortable: true,
        sortField: "createdAt",
        cell: (v) => dateMX(v),
      },
      {
        header: "Estado de pago",
        field: "paymentStatus",
        sortable: false,
        cell: (v) => renderPaymentStatusCell(v),
      },
      {
        header: "Total",
        field: "total",
        sortable: true,
        sortField: "total",
        className: "text-right",
        headerClassName: "text-right",
        cell: (v) => moneyMX(v),
      },
      {
        header: "Pagado",
        field: "paidTotal",
        sortable: false,
        className: "text-right",
        headerClassName: "text-right",
        cell: (v) => moneyMX(v),
      },
      {
        header: "Pendiente",
        field: "remainingTotal",
        sortable: false,
        className: "text-right",
        headerClassName: "text-right",
        cell: (v) => moneyMX(v),
      },
    ],
    [],
  );

  const actions: Array<TableActionDef<PartySalesNoteRowDto>> = [
    {
      type: "details",
      label: "Detalles",
      tooltip: "Ver nota de venta",
      icon: <EyeIcon className="h-5 w-5" />,
    },
    {
      type: "pdf",
      label: "Ver PDF",
      tooltip: "Abrir PDF",
      icon: <DocumentIcon className="h-5 w-5" />,
    },
  ];

  const queryKey = [
    query.page,
    query.pageSize,
    query.sortField ?? "",
    query.sortOrder ?? "",
    query.search ?? "",
    query.paymentStatus,
    query.from,
    query.to,
  ].join("|");

  const updateFilters = (next: {
    paymentStatus?: PartySalesNotePaymentStatus;
    from?: string;
    to?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextPaymentStatus = next.paymentStatus ?? paymentStatus;
    const nextFrom = next.from ?? from;
    const nextTo = next.to ?? to;

    if (nextPaymentStatus === "all") {
      params.delete(PARTY_SALES_NOTES_QUERY_KEYS.paymentStatus);
    } else {
      params.set(PARTY_SALES_NOTES_QUERY_KEYS.paymentStatus, nextPaymentStatus);
    }

    setParam(params, PARTY_SALES_NOTES_QUERY_KEYS.from, nextFrom);
    setParam(params, PARTY_SALES_NOTES_QUERY_KEYS.to, nextTo);

    params.set(PARTY_SALES_NOTES_QUERY_KEYS.page, "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    setPaymentStatus("all");
    setFrom("");
    setTo("");
    updateFilters({ paymentStatus: "all", from: "", to: "" });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Estado</span>
          </label>

          <select
            className="select select-bordered w-full"
            value={paymentStatus}
            onChange={(e) => {
              const next = e.target.value as PartySalesNotePaymentStatus;
              setPaymentStatus(next);
              updateFilters({ paymentStatus: next });
            }}
          >
            <option value="all">Todas</option>
            <option value="paid">Pagadas</option>
            <option value="pending">Pendientes</option>
          </select>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Desde</span>
          </label>

          <input
            type="date"
            className="input input-bordered w-full"
            value={from}
            onChange={(e) => {
              const next = e.target.value;
              setFrom(next);
              updateFilters({ from: next });
            }}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Hasta</span>
          </label>

          <input
            type="date"
            className="input input-bordered w-full"
            value={to}
            onChange={(e) => {
              const next = e.target.value;
              setTo(next);
              updateFilters({ to: next });
            }}
          />
        </div>

        <div className="flex items-end">
          <button
            className="btn btn-ghost w-full"
            type="button"
            onClick={clearFilters}
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <GenericPaginatedTable<PartySalesNoteRowDto>
        key={queryKey}
        data={data}
        columns={columns}
        actions={actions}
        actionsMenu={{ menuLabel: "Más acciones", hideMenuIfEmpty: true }}
        pagination={pagination}
        loading={false}
        onQueryChange={pushTableQuery}
        onAction={(e) => {
          switch (e.type) {
            case "details":
              router.push(routes.salesNotes.details(e.row.id));
              break;
            case "pdf":
              window.open(routes.salesNotes.pdf(e.row.id), "_blank", "noopener,noreferrer");
              break;
          }
        }}
        searchPlaceholder="Buscar por folio…"
        pageSizeOptions={[10, 25, 50]}
        showPageSizeSelector
        initialSort={
          query.sortField && query.sortOrder
            ? {
                sortField: query.sortField,
                sortOrder: query.sortOrder,
              }
            : { sortField: "createdAt", sortOrder: "desc" }
        }
        initialSearchTerm={query.search ?? ""}
      />
    </div>
  );
}
