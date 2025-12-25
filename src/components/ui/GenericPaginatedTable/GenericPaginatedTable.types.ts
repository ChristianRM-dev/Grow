import type React from "react";

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

type ColumnDefBase = {
  header: string;
  sortField?: string;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
};

/**
 * Keys whose values are directly renderable without a cell formatter.
 */
type RenderableKeys<T> = {
  [K in keyof T]-?: T[K] extends React.ReactNode ? K : never;
}[keyof T];

/**
 * Column where the value is renderable -> cell is NOT needed.
 */
type ColumnValue<T> = {
  [K in RenderableKeys<T>]-?: ColumnDefBase & {
    field: K;
    cell?: undefined;
  };
}[RenderableKeys<T>];

/**
 * Column with a custom cell renderer -> cell is required.
 */
type ColumnWithCell<T> = {
  [K in keyof T]-?: ColumnDefBase & {
    field: K;
    cell: (value: T[K], row: T) => React.ReactNode;
  };
}[keyof T];

export type ColumnDef<T> = ColumnValue<T> | ColumnWithCell<T>;

export type TableActionDef<T> = {
  type: string;
  label: string; // Spanish label
  icon?: React.ReactNode;
  tooltip?: string; // Spanish tooltip
  disabled?: (row: T) => boolean;
};
