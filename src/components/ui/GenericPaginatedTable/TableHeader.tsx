// src/components/ui/GenericPaginatedTable/TableHeader.tsx
"use client";

import React from "react";
import type {
  ColumnDef,
  SortOrder,
  TableRow,
} from "./GenericPaginatedTable.types";

type TableHeaderProps<T extends TableRow> = {
  columns: Array<ColumnDef<T>>;
  hasActions: boolean;
  sortField: string;
  sortOrder: SortOrder;
  onSort: (col: ColumnDef<T>) => void;
};

export function TableHeader<T extends TableRow>({
  columns,
  hasActions,
  sortField,
  sortOrder,
  onSort,
}: TableHeaderProps<T>) {
  return (
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
              onClick={() => onSort(col)}
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
  );
}
