// src/components/ui/GenericPaginatedTable/GenericPaginatedTable.types.ts
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

// ✅ Nueva versión con soporte para funciones dinámicas
export type TableActionDef<T> = {
  type: string;
  label: string | ((row: T) => string); // 👈 Puede ser función
  icon?: React.ReactNode | ((row: T) => React.ReactNode); // 👈 Puede ser función
  tooltip?: string | ((row: T) => string); // 👈 Puede ser función
  disabled?: (row: T) => boolean;
};


export type TableActionsMenuConfig = {
  /**
   * How many actions should be rendered inline before moving the rest into a dropdown menu.
   * If undefined, all actions are inline (current behavior).
   */
  inlineCount?: number;

  /**
   * Label used for the dropdown trigger (visually hidden if using icon-only trigger).
   */
  menuLabel?: string;
};
