"use client";

import React, { useEffect, useMemo, useState } from "react";
import type {
  ColumnDef,
  SortOrder,
  TableActionDef,
  TableActionEvent,
  TablePagination,
  TableQuery,
  TableRow,
} from "./GenericPaginatedTable.types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type Props<T extends TableRow> = {
  data: T[];
  columns: Array<ColumnDef<T>>;
  actions?: Array<TableActionDef<T>>;
  pagination: TablePagination;
  loading: boolean;

  /**
   * Parent-owned querying (fetching) logic.
   * Component only emits query intents.
   */
  onQueryChange: (query: TableQuery) => void;

  /**
   * Parent-owned action handling.
   */
  onAction?: (event: TableActionEvent<T>) => void;

  /**
   * UI options
   */
  searchPlaceholder?: string; // Spanish
  initialSort?: { sortField: string; sortOrder: SortOrder };
  initialSearchTerm?: string;

  /**
   * Debounce for search (ms). Default: 300
   */
  searchDebounceMs?: number;
};

export function GenericPaginatedTable<T extends TableRow>({
  data,
  columns,
  actions = [],
  pagination,
  loading,
  onQueryChange,
  onAction,
  searchPlaceholder = "Buscar…",
  initialSort = { sortField: "createdAt", sortOrder: "desc" },
  initialSearchTerm = "",
  searchDebounceMs = 300,
}: Props<T>) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [sortField, setSortField] = useState(initialSort.sortField);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSort.sortOrder);

  const hasActions = actions.length > 0;

  const sortableColumns = useMemo(
    () => columns.filter((c) => c.sortable),
    [columns]
  );

  // Debounced search emits query changes; page resets to 1.
  useEffect(() => {
    const handle = setTimeout(() => {
      onQueryChange({
        pagination: { page: 1, pageSize: pagination.pageSize },
        sort: { sortField, sortOrder },
        search: searchTerm.trim() ? { term: searchTerm.trim() } : undefined,
      });
    }, searchDebounceMs);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const emitQuery = (next: Partial<TableQuery>) => {
    const page = next.pagination?.page ?? pagination.page;
    const pageSize = next.pagination?.pageSize ?? pagination.pageSize;

    const nextSort = next.sort ?? { sortField, sortOrder };
    const nextSearch =
      next.search !== undefined
        ? next.search
        : searchTerm.trim()
        ? { term: searchTerm.trim() }
        : undefined;

    onQueryChange({
      pagination: { page, pageSize },
      sort: nextSort,
      search: nextSearch,
    });
  };

  const handleSort = (col: ColumnDef<T>) => {
    if (!col.sortable) return;

    const colSortField = col.sortField ?? String(col.field);
    const nextOrder: SortOrder =
      sortField === colSortField && sortOrder === "desc" ? "asc" : "desc";

    setSortField(colSortField);
    setSortOrder(nextOrder);

    emitQuery({
      pagination: { page: 1, pageSize: pagination.pageSize },
      sort: { sortField: colSortField, sortOrder: nextOrder },
    });
  };

  const goToPage = (page: number) => {
    emitQuery({
      pagination: {
        page: clamp(page, 1, Math.max(1, pagination.totalPages)),
        pageSize: pagination.pageSize,
      },
      sort: { sortField, sortOrder },
    });
  };

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="input input-bordered flex items-center gap-2 w-full md:max-w-sm">
          {/* Simple magnifier icon */}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4 opacity-70"
          >
            <path
              fill="currentColor"
              d="M10 4a6 6 0 1 1 3.88 10.58l4.27 4.27-1.41 1.41-4.27-4.27A6 6 0 0 1 10 4m0 2a4 4 0 1 0 0 8a4 4 0 0 0 0-8"
            />
          </svg>
          <input
            className="grow"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar"
          />
        </label>

        <div className="flex items-center gap-2 justify-end">
          {loading ? (
            <span className="loading loading-spinner loading-sm" />
          ) : null}

          {/* Optional hint */}
          {sortableColumns.length > 0 ? (
            <span className="text-xs opacity-70">
              Ordena dando click en el encabezado
            </span>
          ) : null}
        </div>
      </div>

      {/* Table */}
      <div className="mt-3 overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              {columns.map((col) => {
                const colSortField = col.sortField ?? String(col.field);
                const isActive = col.sortable && sortField === colSortField;

                return (
                  <th
                    key={String(col.field)}
                    className={[
                      col.headerClassName ?? "",
                      col.sortable ? "cursor-pointer select-none" : "",
                    ].join(" ")}
                    onClick={() => handleSort(col)}
                    scope="col"
                  >
                    <div className="inline-flex items-center gap-2">
                      <span>{col.header}</span>
                      {col.sortable ? (
                        <span className="opacity-70">
                          {isActive ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                        </span>
                      ) : null}
                    </div>
                  </th>
                );
              })}

              {hasActions ? <th scope="col">Acciones</th> : null}
            </tr>
          </thead>

          <tbody>
            {!loading && data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="text-center py-10 opacity-70"
                >
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
                      {col.cell ? col.cell(value as any, row) : (value as any)}
                    </td>
                  );
                })}

                {hasActions ? (
                  <td>
                    <div className="flex items-center gap-2">
                      {actions.map((action) => {
                        const isDisabled = action.disabled
                          ? action.disabled(row)
                          : false;

                        const content = action.icon ? (
                          <span className="inline-flex items-center gap-2">
                            {action.icon}
                            <span className="hidden lg:inline">
                              {action.label}
                            </span>
                          </span>
                        ) : (
                          action.label
                        );

                        // DaisyUI tooltip requires `data-tip` + `.tooltip`
                        const tooltip = action.tooltip ?? action.label;

                        return (
                          <div
                            key={action.type}
                            className="tooltip"
                            data-tip={tooltip}
                          >
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              disabled={isDisabled}
                              onClick={() =>
                                onAction?.({ type: action.type, row })
                              }
                              aria-label={action.label}
                            >
                              {content}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}

            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="py-10"
                >
                  <div className="flex items-center justify-center gap-3 opacity-70">
                    <span className="loading loading-spinner loading-md" />
                    <span>Cargando…</span>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="text-sm opacity-70">
          Página <b>{pagination.page}</b> de <b>{pagination.totalPages}</b>
          {typeof pagination.totalItems === "number" ? (
            <>
              {" "}
              · <b>{pagination.totalItems}</b> elementos
            </>
          ) : null}
        </div>

        <div className="join justify-end">
          <button
            className="btn btn-sm join-item"
            onClick={() => goToPage(1)}
            disabled={loading || pagination.page <= 1}
          >
            «
          </button>
          <button
            className="btn btn-sm join-item"
            onClick={() => goToPage(pagination.page - 1)}
            disabled={loading || pagination.page <= 1}
          >
            Anterior
          </button>
          <button className="btn btn-sm join-item btn-disabled">
            {pagination.page}
          </button>
          <button
            className="btn btn-sm join-item"
            onClick={() => goToPage(pagination.page + 1)}
            disabled={loading || pagination.page >= pagination.totalPages}
          >
            Siguiente
          </button>
          <button
            className="btn btn-sm join-item"
            onClick={() => goToPage(pagination.totalPages)}
            disabled={loading || pagination.page >= pagination.totalPages}
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
