import { notFound } from "next/navigation";

/**
 * Standard where clause to exclude soft-deleted records
 */
export const excludeSoftDeleted = { isDeleted: false } as const;

/**
 * Standard where clause for payments excluding soft-deleted
 */
export const excludeSoftDeletedPayments = { isDeleted: false } as const;

/**
 * Throws notFound() if a resource is soft-deleted or doesn't exist
 * Use this in detail/edit queries when a soft-deleted record should be treated as not found
 */
export function assertNotSoftDeleted<T extends { isDeleted?: boolean } | null>(
  resource: T,
  resourceName: string = "recurso"
): asserts resource is NonNullable<T> {
  if (!resource) {
    notFound();
  }

  if ("isDeleted" in resource && resource.isDeleted === true) {
    console.warn(
      `[assertNotSoftDeleted] ${resourceName} está eliminado, redirigiendo a 404`
    );
    notFound();
  }
}

/**
 * Type guard to check if a resource exists and is not soft-deleted
 */
export function isActiveResource<T extends { isDeleted?: boolean } | null>(
  resource: T
): resource is NonNullable<T> & { isDeleted: false } {
  return (
    resource !== null &&
    (!("isDeleted" in resource) || resource.isDeleted === false)
  );
}
