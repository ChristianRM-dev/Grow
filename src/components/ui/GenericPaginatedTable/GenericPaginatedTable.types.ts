import type React from "react";

/**
 * Basic requirement for stable row keys.
 */
export type TableRow = {
  id: string;
};

export type SortOrder = "asc" | "desc";

export type TableQuery = {
  pagination: { page: number; pageSize: number };
  sort?: { sortField: string; sortOrder: SortOrder };
  search?: { term: string };
};

export type TablePagination = {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems?: number;
};

export type TableActionEvent<T> = {
  type: string;
  row: T;
};

type ColumnDefBase<T> = {
  header: string;
  /** If provided, overrides which field name is sent on sort. */
  sortField?: string;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
};

/**
 * Strongly-typed column definition:
 * - field is a keyof T
 * - cell receives the exact type T[K]
 */
export type ColumnDef<T> = {
  [K in keyof T]-?: ColumnDefBase<T> & {
    field: K;
    cell?: (value: T[K], row: T) => React.ReactNode;
  };
}[keyof T];

export type TableActionDef<T> = {
  type: string;
  label: string; // Spanish label for accessibility/tooltip
  icon?: React.ReactNode;
  tooltip?: string; // Spanish tooltip
  disabled?: (row: T) => boolean;
};
