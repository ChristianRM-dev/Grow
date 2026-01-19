"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";

import { GenericPaginatedTable } from "@/components/ui/GenericPaginatedTable/GenericPaginatedTable";
import type {
  ColumnDef,
  TableActionDef,
  TablePagination,
} from "@/components/ui/GenericPaginatedTable/GenericPaginatedTable.types";
import { useTableUrlQuery } from "@/modules/shared/tables/useTableUrlQuery";

import type {
  PartyDetailsDto,
  PartyLedgerRowDto,
  PartyLedgerSummaryDto,
} from "@/modules/parties/queries/getPartyDetailsWithLedger.query";

import { EyeIcon, PencilSquareIcon } from "@heroicons/react/16/solid";
import { moneyMX } from "@/modules/shared/utils/formatters";



function sideBadge(side: string) {
  const s = String(side).toUpperCase();
  const cls =
    s === "RECEIVABLE"
      ? "badge-info"
      : s === "PAYABLE"
      ? "badge-warning"
      : "badge-ghost";
  const label =
    s === "RECEIVABLE" ? "Por cobrar" : s === "PAYABLE" ? "Por pagar" : side;
  return <span className={`badge ${cls}`}>{label}</span>;
}

function sourceTypeBadge(t: string) {
  const s = String(t).toUpperCase();
  const cls =
    s === "SALES_NOTE"
      ? "badge-success"
      : s === "PAYMENT"
      ? "badge-primary"
      : s === "SUPPLIER_PURCHASE"
      ? "badge-secondary"
      : "badge-ghost";

  const label =
    s === "SALES_NOTE"
      ? "Nota de venta"
      : s === "PAYMENT"
      ? "Pago"
      : s === "SUPPLIER_PURCHASE"
      ? "Compra"
      : s === "ADJUSTMENT"
      ? "Ajuste"
      : t;

  return <span className={`badge ${cls}`}>{label}</span>;
}

function roleBadge(role: string) {
  const r = String(role).toUpperCase();
  const cls =
    r === "CUSTOMER"
      ? "badge-success"
      : r === "SUPPLIER"
      ? "badge-warning"
      : "badge-ghost";
  const label =
    r === "CUSTOMER" ? "Cliente" : r === "SUPPLIER" ? "Proveedor" : role;
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function PartyDetailsClient({
  party,
  summary,
  ledger,
}: {
  party: PartyDetailsDto;
  summary: PartyLedgerSummaryDto;
  ledger: { data: PartyLedgerRowDto[]; pagination: TablePagination };
}) {
  const router = useRouter();
  const pushTableQuery = useTableUrlQuery();

  const columns: Array<ColumnDef<PartyLedgerRowDto>> = useMemo(
    () => [
      {
        header: "Fecha",
        field: "occurredAt",
        sortable: true,
        sortField: "occurredAt",
        cell: (v) => new Date(v).toLocaleString("es-MX"),
      },
      {
        header: "Referencia",
        field: "reference",
        sortable: true,
        sortField: "reference",
      },
      {
        header: "Tipo",
        field: "sourceType",
        sortable: true,
        sortField: "sourceType",
        cell: (v) => sourceTypeBadge(v),
      },
      {
        header: "Lado",
        field: "side",
        sortable: true,
        sortField: "side",
        cell: (v) => sideBadge(v),
      },
      {
        header: "Monto",
        field: "amount",
        sortable: true,
        sortField: "amount",
        cell: (v) => moneyMX(v),
      },
      {
        header: "Notas",
        field: "notes",
        sortable: false,
        cell: (v) => (v ? v : "—"),
      },
    ],
    [],
  );

  const actions: Array<TableActionDef<PartyLedgerRowDto>> = [
    {
      type: "view",
      label: "Ver",
      tooltip: "Ver origen",
      icon: <EyeIcon className="h-5 w-5" />,
      disabled: (row) => !(row.sourceType === "SALES_NOTE" && row.sourceId),
    },
  ];

  const net = Number(summary.netTotal);
  const netLabel = Number.isFinite(net)
    ? net >= 0
      ? "Saldo a favor (nos deben)"
      : "Saldo en contra (debemos)"
    : "Saldo";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-xl font-semibold">{party.name}</h1>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {party.roles?.length ? (
                  party.roles.map((r) => <span key={r}>{roleBadge(r)}</span>)
                ) : (
                  <span className="badge badge-ghost">Sin rol</span>
                )}
              </div>

              <div className="mt-3 text-sm opacity-80 space-y-1">
                <div>
                  <span className="font-medium">Teléfono:</span>{" "}
                  {party.phone ? party.phone : "—"}
                </div>
                <div>
                  <span className="font-medium">Notas:</span>{" "}
                  {party.notes ? party.notes : "—"}
                </div>
                <div className="opacity-70">
                  Registrado:{" "}
                  {new Date(party.createdAt).toLocaleString("es-MX")}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => router.push(`/parties/${party.id}/edit`)}
              >
                <PencilSquareIcon className="h-5 w-5" />
                Editar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estado de cuenta */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="stat bg-base-100 shadow-sm rounded-box">
          <div className="stat-title">Por cobrar</div>
          <div className="stat-value text-info">
            {moneyMX(summary.receivableTotal)}
          </div>
          {/* <div className="stat-desc">Movimientos RECEIVABLE</div> */}
        </div>

        <div className="stat bg-base-100 shadow-sm rounded-box">
          <div className="stat-title">Por pagar</div>
          <div className="stat-value text-warning">
            {moneyMX(summary.payableTotal)}
          </div>
          {/* <div className="stat-desc">Movimientos PAYABLE</div> */}
        </div>

        <div className="stat bg-base-100 shadow-sm rounded-box">
          <div className="stat-title">{netLabel}</div>
          <div className="stat-value">{moneyMX(String(Math.abs(net)))}</div>
          <div className="stat-desc">Neto = cobrar − pagar</div>
        </div>
      </div>

      {/* Ledger table */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Historial contable</h2>
            <span className="text-sm opacity-70">
              {ledger.pagination.totalItems} movimientos
            </span>
          </div>

          <div className="mt-3">
            <GenericPaginatedTable<PartyLedgerRowDto>
              data={ledger.data}
              columns={columns}
              actions={actions}
              pagination={ledger.pagination}
              loading={false}
              onQueryChange={pushTableQuery}
              onAction={(e) => {
                if (
                  e.type === "view" &&
                  e.row.sourceType === "SALES_NOTE" &&
                  e.row.sourceId
                ) {
                  router.push(`/sales-notes/${e.row.sourceId}`);
                }
              }}
              searchPlaceholder="Buscar por referencia o notas…"
              pageSizeOptions={[10, 25, 50]}
              showPageSizeSelector
              initialSort={{ sortField: "occurredAt", sortOrder: "desc" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
