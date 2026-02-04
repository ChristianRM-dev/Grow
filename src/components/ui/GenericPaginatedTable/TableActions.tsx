// src/components/ui/GenericPaginatedTable/TableActions.tsx
"use client";

import React, { useEffect, useId, useMemo, useRef } from "react";
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
  const menuLabel = actionsMenu?.menuLabel ?? "Más acciones";
  const hideMenuIfEmpty = actionsMenu?.hideMenuIfEmpty ?? true;

  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const dropdownId = useId();

  const { inlineActions, menuActions } = useMemo(() => {
    const sorted = [...actions].sort((a, b) => {
      const ao = a.order ?? 0;
      const bo = b.order ?? 0;
      return ao - bo;
    });

    const inline: Array<TableActionDef<T>> = [];
    const menu: Array<TableActionDef<T>> = [];

    for (const a of sorted) {
      if (a.placement === "menu") menu.push(a);
      else inline.push(a);
    }

    return { inlineActions: inline, menuActions: menu };
  }, [actions]);

  const hasMenu = menuActions.length > 0;
  const shouldShowMenuTrigger = hasMenu || !hideMenuIfEmpty;

  // Close on outside click + Escape, and ensure only one dropdown is open at a time.
  useEffect(() => {
    if (!shouldShowMenuTrigger) return;

    const details = detailsRef.current;
    if (!details) return;

    const handlePointerDown = (e: PointerEvent) => {
      const current = detailsRef.current;
      if (!current) return;

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

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [shouldShowMenuTrigger]);

  const handleToggle = () => {
    const current = detailsRef.current;
    if (!current) return;

    const isOpen = current.hasAttribute("open");

    if (isOpen) {
      // Opening: close any other open dropdown first.
      if (openDetailsEl && openDetailsEl !== current) {
        openDetailsEl.removeAttribute("open");
      }
      openDetailsEl = current;
    } else {
      // Closing
      if (openDetailsEl === current) openDetailsEl = null;
    }
  };

  const closeMenu = () => {
    const current = detailsRef.current;
    if (!current) return;
    current.removeAttribute("open");
    if (openDetailsEl === current) openDetailsEl = null;
  };

  // If there is no dropdown trigger, render only inline actions.
  if (!shouldShowMenuTrigger) {
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
      </div>
    );
  }

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
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <EllipsisVerticalIcon className="h-5 w-5" />
          <span className="hidden lg:inline">Más</span>
        </summary>

        <ul className="menu dropdown-content z-[10] w-60 rounded-box bg-base-100 p-2 shadow border border-base-300/50">
          {hasMenu ? (
            menuActions.map((action) => (
              <MenuActionItem
                key={String(action.type)}
                action={action}
                row={row}
                onAction={onAction}
                closeMenu={closeMenu}
              />
            ))
          ) : (
            <li className="px-3 py-2 text-sm opacity-70">Sin acciones</li>
          )}
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

  return (
    <div className="tooltip" data-tip={tooltip}>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={isDisabled}
        aria-label={label}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onAction?.({ type: action.type, row });
        }}
      >
        {icon ? (
          <span className="inline-flex items-center gap-2">
            {icon}
            <span className="hidden lg:inline">{label}</span>
          </span>
        ) : (
          label
        )}
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

  return (
    <li>
      <button
        type="button"
        className="tooltip tooltip-left w-full flex items-center gap-2 justify-start"
        data-tip={tooltip}
        disabled={isDisabled}
        aria-label={label}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          closeMenu();
          onAction?.({ type: action.type, row });
        }}
      >
        {icon ? (
          <span className="inline-flex h-5 w-5 items-center justify-center">
            {icon}
          </span>
        ) : (
          <span className="inline-flex h-5 w-5" />
        )}
        <span className="truncate">{label}</span>
      </button>
    </li>
  );
}
