import { z } from "zod";

export const SortOrderEnum = z.enum(["asc", "desc"]);

export const TableSearchParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(10),
  sortField: z.string().optional(),
  sortOrder: SortOrderEnum.optional(),
  search: z.string().optional(),
});

export type ParsedTableQuery = z.infer<typeof TableSearchParamsSchema>;

export function parseTableSearchParams(
  rawSearchParams: unknown
): ParsedTableQuery {
  const parsed = TableSearchParamsSchema.safeParse(rawSearchParams ?? {});
  return parsed.success ? parsed.data : TableSearchParamsSchema.parse({});
}
