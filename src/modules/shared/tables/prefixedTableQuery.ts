import type { TableQuery } from "./tableQuery";

function capitalizeFirst(value: string) {
  if (!value) return value;
  return value[0].toUpperCase() + value.slice(1);
}

export function makePrefixedParamName(prefix: string, key: string) {
  return `${prefix}${capitalizeFirst(key)}`;
}

export function readPrefixedParam(
  searchParams: Record<string, string | string[] | undefined>,
  prefix: string,
  key: string,
) {
  const value = searchParams[makePrefixedParamName(prefix, key)];
  if (Array.isArray(value)) return value[0];
  return value;
}

export function applyPrefixedTableQueryToParams(
  params: URLSearchParams,
  q: TableQuery,
  prefix: string,
) {
  params.set(makePrefixedParamName(prefix, "page"), String(q.pagination.page));
  params.set(
    makePrefixedParamName(prefix, "pageSize"),
    String(q.pagination.pageSize),
  );

  if (q.sort) {
    params.set(makePrefixedParamName(prefix, "sortField"), q.sort.sortField);
    params.set(makePrefixedParamName(prefix, "sortOrder"), q.sort.sortOrder);
  } else {
    params.delete(makePrefixedParamName(prefix, "sortField"));
    params.delete(makePrefixedParamName(prefix, "sortOrder"));
  }

  if (q.search?.term) {
    params.set(makePrefixedParamName(prefix, "search"), q.search.term);
  } else {
    params.delete(makePrefixedParamName(prefix, "search"));
  }

  return params;
}
