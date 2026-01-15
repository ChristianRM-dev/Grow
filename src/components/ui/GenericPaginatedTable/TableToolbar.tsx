// src/components/ui/GenericPaginatedTable/TableToolbar.tsx
"use client";

import React from "react";

type TableToolbarProps = {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchPlaceholder: string;
  loading: boolean;
};

export function TableToolbar({
  searchTerm,
  onSearchChange,
  searchPlaceholder,
  loading,
}: TableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <label className="input input-bordered flex items-center gap-2 w-full md:max-w-sm">
        <input
          className="grow"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Buscar"
        />
      </label>

      <div className="flex items-center gap-2 justify-end">
        {loading ? (
          <span className="loading loading-spinner loading-sm" />
        ) : null}
      </div>
    </div>
  );
}
