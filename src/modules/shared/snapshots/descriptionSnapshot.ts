// src/modules/shared/snapshots/descriptionSnapshot.ts
import { safeTrim } from "@/modules/shared/utils/strings";

/**
 * Builds a snapshot preserving what user saw/typed at the time of sale.
 * If description is empty, snapshot is just the name.
 */
export function buildDescriptionSnapshot(
  name: string,
  description?: string | null
): string {
  const n = safeTrim(name);
  const d = safeTrim(description);
  if (!d) return n || "—";
  return `${n} — ${d}`;
}
