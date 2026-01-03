/**
 * Generates a filesystem-safe filename part.
 */
export function safeFileNamePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-+/g, "-")
    .slice(0, 80);
}
