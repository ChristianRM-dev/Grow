import { z } from "zod";

export type SortOrder = "asc" | "desc";

export type TableQuery = {
  pagination: { page: number; pageSize: number };
  sort?: { sortField: string; sortOrder: SortOrder };
  search?: { term: string };
};

/**
 * Next.js passes searchParams as string | string[] | undefined.
 */
export type NextSearchParams = Record<string, string | string[] | undefined>;

function pickFirst(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

const sortOrderSchema = z.enum(["asc", "desc"]);

export type TableQueryDefaults = {
  page: number;
  pageSize: number;
  sortField?: string;
  sortOrder?: SortOrder;
};

export type TableQueryParseOptions = {
  /**
   * Security: only allow sorting by known fields.
   * Feature modules must pass the whitelist.
   */
  allowedSortFields: readonly string[];
  defaults: TableQueryDefaults;

  /**
   * Limits to avoid abuse (very large page sizes).
   */
  pageSizeLimits?: { min: number; max: number };
};

/**
 * Factory to create a feature-specific parser while reusing shared logic.
 */
export function createTableQueryParser(options: TableQueryParseOptions) {
  const limits = options.pageSizeLimits ?? { min: 5, max: 100 };

  const schema = z.object({
    page: z.coerce.number().int().min(1).default(options.defaults.page),
    pageSize: z.coerce
      .number()
      .int()
      .min(limits.min)
      .max(limits.max)
      .default(options.defaults.pageSize),

    sortField: z.string().optional(),
    sortOrder: sortOrderSchema.optional(),

    search: z.string().optional(),
  });

  return function parseTableQuery(searchParams: NextSearchParams): TableQuery {
    const raw = {
      page: pickFirst(searchParams.page),
      pageSize: pickFirst(searchParams.pageSize),
      sortField: pickFirst(searchParams.sortField),
      sortOrder: pickFirst(searchParams.sortOrder),
      search: pickFirst(searchParams.search),
    };

    const parsed = schema.parse(raw);

    // Apply safe sort defaults + whitelist.
    const requestedSortField = parsed.sortField ?? options.defaults.sortField;
    const requestedSortOrder = parsed.sortOrder ?? options.defaults.sortOrder;

    const sort =
      requestedSortField &&
      options.allowedSortFields.includes(requestedSortField)
        ? {
            sortField: requestedSortField,
            sortOrder: (requestedSortOrder ?? "desc") as SortOrder,
          }
        : undefined;

    const term = (parsed.search ?? "").trim();
    const search = term ? { term } : undefined;

    return {
      pagination: { page: parsed.page, pageSize: parsed.pageSize },
      sort,
      search,
    };
  };
}

/**
 * Helper for consistent totalPages calc in queries.
 */
export function computeTotalPages(
  totalItems: number,
  pageSize: number
): number {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}
