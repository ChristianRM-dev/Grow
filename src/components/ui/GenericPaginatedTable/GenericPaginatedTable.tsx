"use client";

import React, { useEffect, useRef, useState } from "react";
import type {
  ColumnDef,
  SortOrder,
  TableActionDef,
  TableActionEvent,
  TablePagination,
  TableQuery,
  TableRow,
  TableActionsMenuConfig,
} from "./GenericPaginatedTable.types";
import { clamp } from "./helpers";
import { TableToolbar } from "./TableToolbar";
import { TableHeader } from "./TableHeader";
import { TableBody } from "./TableBody";
import { TablePaginationControls } from "./TablePaginationControls";

type Props<T extends TableRow> = {
  data: T[];
  columns: Array<ColumnDef<T>>;
  actions?: Array<TableActionDef<T>>;
  pagination: TablePagination;
  loading: boolean;

  onQueryChange: (query: TableQuery) => void;
  onAction?: (event: TableActionEvent<T>) => void;

  searchPlaceholder?: string;
  initialSort?: { sortField: string; sortOrder: SortOrder };
  initialSearchTerm?: string;
  searchDebounceMs?: number;

  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;

  // NEW: collapsible row actions
  actionsMenu?: TableActionsMenuConfig;
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
  pageSizeOptions = [10, 25, 50],
  showPageSizeSelector = true,
  actionsMenu,
}: Props<T>) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [sortField, setSortField] = useState(initialSort.sortField);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSort.sortOrder);

  const didMountRef = useRef(false);
  const hasActions = actions.length > 0;

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

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

  const handlePageSizeChange = (nextPageSize: number) => {
    emitQuery({
      pagination: { page: 1, pageSize: nextPageSize },
      sort: { sortField, sortOrder },
    });
  };

  return (
    <div className="w-full">
      <TableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={searchPlaceholder}
        loading={loading}
      />

      <div className="mt-3 overflow-x-auto">
        <table className="table table-zebra w-full">
          <TableHeader
            columns={columns}
            hasActions={hasActions}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
          />

          <TableBody
            data={data}
            columns={columns}
            actions={actions}
            actionsMenu={actionsMenu}
            hasActions={hasActions}
            loading={loading}
            onAction={onAction}
          />
        </table>
      </div>

      <TablePaginationControls
        pagination={pagination}
        loading={loading}
        showPageSizeSelector={showPageSizeSelector}
        pageSizeOptions={pageSizeOptions}
        onPageChange={goToPage}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}
