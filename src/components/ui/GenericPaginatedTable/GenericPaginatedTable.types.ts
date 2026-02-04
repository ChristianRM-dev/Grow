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

type RenderableKeys<T> = {
  [K in keyof T]-?: T[K] extends React.ReactNode ? K : never;
}[keyof T];

type ColumnValue<T> = {
  [K in RenderableKeys<T>]-?: ColumnDefBase & {
    field: K;
    cell?: undefined;
  };
}[RenderableKeys<T>];

type ColumnWithCell<T> = {
  [K in keyof T]-?: ColumnDefBase & {
    field: K;
    cell: (value: T[K], row: T) => React.ReactNode;
  };
}[keyof T];

export type ColumnDef<T> = ColumnValue<T> | ColumnWithCell<T>;

export type TableActionPlacement = "inline" | "menu";

export type TableActionDef<T> = {
  type: string;

  label: string | ((row: T) => string);
  icon?: React.ReactNode | ((row: T) => React.ReactNode);
  tooltip?: string | ((row: T) => string);

  disabled?: (row: T) => boolean;

  /**
   * Controls where this action is rendered.
   * - "inline": shown as a button in the row
   * - "menu": shown inside the dropdown menu
   * Default: "inline"
   */
  placement?: TableActionPlacement;

  /**
   * Optional ordering hint.
   * Lower numbers render earlier within the same placement bucket.
   */
  order?: number;
};

export type TableActionsMenuConfig = {
  menuLabel?: string;

  /**
   * If true, the menu trigger is not shown when there are no "menu" actions.
   * Default: true
   */
  hideMenuIfEmpty?: boolean;
};
