// src/components/ui/GenericPaginatedTable/TableActions.tsx
"use client";

import React, { useEffect, useId, useRef } from "react";
import type {
  TableActionDef,
  TableActionEvent,
  TableRow,
  TableActionsMenuConfig,
} from "./GenericPaginatedTable.types";
import { resolveValue } from "./helpers";
import { EllipsisVerticalIcon } from "@heroicons/react/16/solid";

// Keep track of the currently open dropdown across the whole app.
// This ensures only one menu stays open at a time.
let openDetailsEl: HTMLDetailsElement | null = null;

type TableActionsProps<T extends TableRow> = {
  actions: Array<TableActionDef<T>>;
  row: T;
  onAction?: (event: TableActionEvent<T>) => void;
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
    typeof inlineCount === "number" && inlineCount > 0 && actions.length > inlineCount;

  const menuLabel = actionsMenu?.menuLabel ?? "Más acciones";

  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const dropdownId = useId();

  // Close on outside click + Escape, and ensure only one dropdown is open at a time.
  useEffect(() => {
    if (!shouldCollapse) return;

    const details = detailsRef.current;
    if (!details) return;

    const handlePointerDown = (e: PointerEvent) => {
      const current = detailsRef.current;
      if (!current) return;

      // If click is outside this dropdown, close it.
      if (!current.contains(e.target as Node)) {
        current.removeAttribute("open");
        if (openDetailsEl === current) openDetailsEl = null;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const current = detailsRef.current;
      if (!current) return;

      current.removeAttribute("open");
      if (openDetailsEl === current) openDetailsEl = null;
    };

    // Use capture so we close before other handlers (more consistent).
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [shouldCollapse]);

  const handleToggle = () => {
    const current = detailsRef.current;
    if (!current) return;

    const isOpen = current.hasAttribute("open");

    // If opening, close any other open dropdown first.
    if (isOpen) {
      if (openDetailsEl && openDetailsEl !== current) {
        openDetailsEl.removeAttribute("open");
      }
      openDetailsEl = current;
    } else {
      if (openDetailsEl === current) openDetailsEl = null;
    }
  };

  const closeMenu = () => {
    const current = detailsRef.current;
    if (!current) return;
    current.removeAttribute("open");
    if (openDetailsEl === current) openDetailsEl = null;
  };

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
    <div className="flex items-center gap-2" data-dropdown-id={dropdownId}>
      {inlineActions.map((action) => (
        <InlineActionButton
          key={String(action.type)}
          action={action}
          row={row}
          onAction={onAction}
        />
      ))}

      {/* DaisyUI Dropdown using <details>/<summary> */}
      <details
        ref={detailsRef}
        className="dropdown dropdown-end"
        onToggle={handleToggle}
      >
        <summary
          className="btn btn-ghost btn-sm list-none"
          aria-label={menuLabel}
          title={menuLabel}
        >
          <EllipsisVerticalIcon className="h-5 w-5" />
          <span className="hidden lg:inline">Más</span>
        </summary>

        <ul className="menu dropdown-content z-[1] w-60 rounded-box bg-base-100 p-2 shadow">
          {menuActions.map((action) => (
            <MenuActionItem
              key={String(action.type)}
              action={action}
              row={row}
              onAction={onAction}
              closeMenu={closeMenu}
            />
          ))}
        </ul>
      </details>
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
  closeMenu,
}: {
  action: TableActionDef<T>;
  row: T;
  onAction?: (event: TableActionEvent<T>) => void;
  closeMenu: () => void;
}) {
  const isDisabled = action.disabled ? action.disabled(row) : false;

  const label = resolveValue(action.label, row);
  const tooltip = action.tooltip ? resolveValue(action.tooltip, row) : label;
  const icon = action.icon ? resolveValue(action.icon, row) : null;

  const handleClick = () => {
    // Close first to avoid any weird focus/blur interactions.
    closeMenu();
    onAction?.({ type: action.type, row });
  };

  return (
    <li>
      <div className="tooltip tooltip-left w-full" data-tip={tooltip}>
        <button
          type="button"
          className="flex w-full items-center gap-2"
          disabled={isDisabled}
          onClick={handleClick}
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
