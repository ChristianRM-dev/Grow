import type { SortOrder } from "@/modules/shared/tables/tableQuery";

export function createPrismaOrderBy<TOrderBy extends Record<string, unknown>>(
  allowedSortFields: readonly string[],
  defaultOrderBy: TOrderBy
) {
  return function toOrderBy(sort?: {
    sortField: string;
    sortOrder: SortOrder;
  }): TOrderBy[] {
    if (!sort) return [defaultOrderBy];

    if (!allowedSortFields.includes(sort.sortField)) {
      return [defaultOrderBy];
    }

    return [{ [sort.sortField]: sort.sortOrder } as unknown as TOrderBy];
  };
}
