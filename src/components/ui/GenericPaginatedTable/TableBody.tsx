// src/components/ui/GenericPaginatedTable/TableBody.tsx
"use client";

import React from "react";
import type {
  ColumnDef,
  TableActionDef,
  TableActionEvent,
  TableRow,
  TableActionsMenuConfig,
} from "./GenericPaginatedTable.types";
import { TableActions } from "./TableActions";

type TableBodyProps<T extends TableRow> = {
  data: T[];
  columns: Array<ColumnDef<T>>;
  actions: Array<TableActionDef<T>>;
  hasActions: boolean;
  loading: boolean;
  onAction?: (event: TableActionEvent<T>) => void;

  // NEW: allow collapsing row actions into a dropdown menu
  actionsMenu?: TableActionsMenuConfig;
};

export function TableBody<T extends TableRow>({
  data,
  columns,
  actions,
  hasActions,
  loading,
  onAction,
  actionsMenu,
}: TableBodyProps<T>) {
  const colSpan = columns.length + (hasActions ? 1 : 0);

  return (
    <tbody>
      {!loading && data.length === 0 ? (
        <tr>
          <td colSpan={colSpan} className="py-10 text-center opacity-70">
            No hay registros
          </td>
        </tr>
      ) : null}

      {data.map((row) => (
        <tr key={row.id}>
          {columns.map((col) => {
            const value = row[col.field];

            return (
              <td key={String(col.field)} className={col.className ?? ""}>
                {col.cell ? <>{col.cell(value, row)}</> : <>{value}</>}
              </td>
            );
          })}

          {hasActions ? (
            <td className="whitespace-nowrap">
              <TableActions
                actions={actions}
                row={row}
                onAction={onAction}
                actionsMenu={actionsMenu}
              />
            </td>
          ) : null}
        </tr>
      ))}

      {loading ? (
        <tr>
          <td colSpan={colSpan} className="py-10">
            <div className="flex items-center justify-center gap-3 opacity-70">
              <span className="loading loading-spinner loading-md" />
              <span>Cargando…</span>
            </div>
          </td>
        </tr>
      ) : null}
    </tbody>
  );
}
