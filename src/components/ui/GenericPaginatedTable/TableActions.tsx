// src/components/ui/GenericPaginatedTable/TableActions.tsx
"use client";

import React from "react";
import type {
  TableActionDef,
  TableActionEvent,
  TableRow,
} from "./GenericPaginatedTable.types";
import { resolveValue } from "./helpers";

type TableActionsProps<T extends TableRow> = {
  actions: Array<TableActionDef<T>>;
  row: T;
  onAction?: (event: TableActionEvent<T>) => void;
};

export function TableActions<T extends TableRow>({
  actions,
  row,
  onAction,
}: TableActionsProps<T>) {
  return (
    <div className="flex items-center gap-2">
      {actions.map((action) => {
        const isDisabled = action.disabled ? action.disabled(row) : false;

        // 👇 Resolver valores dinámicos
        const label = resolveValue(action.label, row);
        const tooltip = action.tooltip
          ? resolveValue(action.tooltip, row)
          : label;
        const icon = action.icon ? resolveValue(action.icon, row) : null;

        const content = icon ? (
          <span className="inline-flex items-center gap-2">
            {icon}
            <span className="hidden lg:inline">{label}</span>
          </span>
        ) : (
          label
        );

        return (
          <div key={action.type} className="tooltip" data-tip={tooltip}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={isDisabled}
              onClick={() => onAction?.({ type: action.type, row })}
              aria-label={label}
            >
              {content}
            </button>
          </div>
        );
      })}
    </div>
  );
}
