"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { TableQuery } from "@/modules/shared/tables/tableQuery";

type Options = {
  /**
   * If true, will preserve existing unrelated query params.
   * Default: true
   */
  preserveOtherParams?: boolean;
};

function applyTableQueryToParams(params: URLSearchParams, q: TableQuery) {
  params.set("page", String(q.pagination.page));
  params.set("pageSize", String(q.pagination.pageSize));

  if (q.sort) {
    params.set("sortField", q.sort.sortField);
    params.set("sortOrder", q.sort.sortOrder);
  } else {
    params.delete("sortField");
    params.delete("sortOrder");
  }

  if (q.search?.term) params.set("search", q.search.term);
  else params.delete("search");

  return params;
}

/**
 * Generic helper to push TableQuery into URL search params.
 * Reuse this in all table client wrappers (products/parties/salesNotes).
 */
export function useTableUrlQuery(options?: Options) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const preserve = options?.preserveOtherParams ?? true;

  return (q: TableQuery) => {
    const params = preserve
      ? new URLSearchParams(sp.toString())
      : new URLSearchParams();

    applyTableQueryToParams(params, q);
    router.push(`${pathname}?${params.toString()}`);
  };
}
