// src/components/ui/GenericPaginatedTable/TablePaginationControls.tsx
"use client";

import React from "react";
import type { TablePagination } from "./GenericPaginatedTable.types";

type TablePaginationControlsProps = {
  pagination: TablePagination;
  loading: boolean;
  showPageSizeSelector: boolean;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function TablePaginationControls({
  pagination,
  loading,
  showPageSizeSelector,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: TablePaginationControlsProps) {
  return (
    <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="text-sm opacity-70">
        Página <b>{pagination.page}</b> de <b>{pagination.totalPages}</b>
        {typeof pagination.totalItems === "number" ? (
          <>
            {" "}
            · <b>{pagination.totalItems}</b> elementos
          </>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-3">
        {showPageSizeSelector ? (
          <label className="flex items-center gap-2 text-sm">
            <span className="opacity-70">Filas:</span>
            <select
              className="select select-bordered select-sm"
              value={pagination.pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={loading}
              aria-label="Filas por página"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="join">
          <button
            className="btn btn-sm join-item"
            onClick={() => onPageChange(1)}
            disabled={loading || pagination.page <= 1}
          >
            «
          </button>
          <button
            className="btn btn-sm join-item"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={loading || pagination.page <= 1}
          >
            Anterior
          </button>
          <button className="btn btn-sm join-item btn-disabled">
            {pagination.page}
          </button>
          <button
            className="btn btn-sm join-item"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={loading || pagination.page >= pagination.totalPages}
          >
            Siguiente
          </button>
          <button
            className="btn btn-sm join-item"
            onClick={() => onPageChange(pagination.totalPages)}
            disabled={loading || pagination.page >= pagination.totalPages}
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
