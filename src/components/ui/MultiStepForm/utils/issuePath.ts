/**
 * Safely converts a Zod issue path into a dot-path string.
 * Zod uses PropertyKey[] (string | number | symbol) in some versions.
 */
export function issuePathToDotPath(issuePath: readonly PropertyKey[]): string {
  return issuePath
    .map((segment) => {
      if (typeof segment === "string") return segment;
      if (typeof segment === "number") return segment.toString();
      // Handle symbols
      if (typeof segment === "symbol") {
        return segment.description || segment.toString();
      }
      return String(segment);
    })
    .join(".");
}
