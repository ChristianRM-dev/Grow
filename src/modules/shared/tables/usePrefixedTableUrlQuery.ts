"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { TableQuery } from "./tableQuery";
import { applyPrefixedTableQueryToParams } from "./prefixedTableQuery";

type Options = {
  /**
   * If true, will preserve existing unrelated query params.
   * Default: true
   */
  preserveOtherParams?: boolean;
};

export function usePrefixedTableUrlQuery(prefix: string, options?: Options) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const preserve = options?.preserveOtherParams ?? true;

  return (q: TableQuery) => {
    const params = preserve
      ? new URLSearchParams(sp.toString())
      : new URLSearchParams();

    applyPrefixedTableQueryToParams(params, q, prefix);
    router.push(`${pathname}?${params.toString()}`);
  };
}
