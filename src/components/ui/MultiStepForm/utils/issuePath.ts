/**
 * Safely converts a Zod issue path into a dot-path string.
 */
export function issuePathToDotPath(issuePath: Array<string | number>): string {
  return issuePath.map(String).join(".");
}
