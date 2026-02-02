// src/components/ui/GenericPaginatedTable/TableActions.tsx
"use client";

import React from "react";
import type {
  TableActionDef,
  TableActionEvent,
  TableRow,
  TableActionsMenuConfig,
} from "./GenericPaginatedTable.types";
import { resolveValue } from "./helpers";
import { EllipsisVerticalIcon } from "@heroicons/react/16/solid";

type TableActionsProps<T extends TableRow> = {
  actions: Array<TableActionDef<T>>;
  row: T;
  onAction?: (event: TableActionEvent<T>) => void;

  // NEW: allow collapsing row actions into a dropdown menu
  actionsMenu?: TableActionsMenuConfig;
};

export function TableActions<T extends TableRow>({
  actions,
  row,
  onAction,
  actionsMenu,
}: TableActionsProps<T>) {
  const inlineCount =
    typeof actionsMenu?.inlineCount === "number"
      ? actionsMenu.inlineCount
      : undefined;

  const shouldCollapse =
    typeof inlineCount === "number" &&
    inlineCount > 0 &&
    actions.length > inlineCount;

  const menuLabel = actionsMenu?.menuLabel ?? "Más acciones";

  if (!shouldCollapse) {
    return (
      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <InlineActionButton
            key={String(action.type)}
            action={action}
            row={row}
            onAction={onAction}
          />
        ))}
      </div>
    );
  }

  const inlineActions = actions.slice(0, inlineCount);
  const menuActions = actions.slice(inlineCount);

  return (
    <div className="flex items-center gap-2">
      {inlineActions.map((action) => (
        <InlineActionButton
          key={String(action.type)}
          action={action}
          row={row}
          onAction={onAction}
        />
      ))}

      <div className="dropdown dropdown-end">
        <div className="tooltip" data-tip={menuLabel}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            aria-label={menuLabel}
            title={menuLabel}
          >
            <EllipsisVerticalIcon className="h-5 w-5" />
            <span className="hidden lg:inline">Más</span>
          </button>
        </div>

        <ul className="menu dropdown-content z-[1] w-60 rounded-box bg-base-100 p-2 shadow">
          {menuActions.map((action) => (
            <MenuActionItem
              key={String(action.type)}
              action={action}
              row={row}
              onAction={onAction}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

function InlineActionButton<T extends TableRow>({
  action,
  row,
  onAction,
}: {
  action: TableActionDef<T>;
  row: T;
  onAction?: (event: TableActionEvent<T>) => void;
}) {
  const isDisabled = action.disabled ? action.disabled(row) : false;

  const label = resolveValue(action.label, row);
  const tooltip = action.tooltip ? resolveValue(action.tooltip, row) : label;
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
    <div className="tooltip" data-tip={tooltip}>
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
}

function MenuActionItem<T extends TableRow>({
  action,
  row,
  onAction,
}: {
  action: TableActionDef<T>;
  row: T;
  onAction?: (event: TableActionEvent<T>) => void;
}) {
  const isDisabled = action.disabled ? action.disabled(row) : false;

  const label = resolveValue(action.label, row);
  const tooltip = action.tooltip ? resolveValue(action.tooltip, row) : label;
  const icon = action.icon ? resolveValue(action.icon, row) : null;

  return (
    <li>
      <div className="tooltip tooltip-left w-full" data-tip={tooltip}>
        <button
          type="button"
          className="flex w-full items-center gap-2"
          disabled={isDisabled}
          onClick={() => onAction?.({ type: action.type, row })}
          aria-label={label}
        >
          {icon ? (
            <span className="inline-flex h-5 w-5 items-center justify-center">
              {icon}
            </span>
          ) : null}
          <span className="truncate">{label}</span>
        </button>
      </div>
    </li>
  );
}
