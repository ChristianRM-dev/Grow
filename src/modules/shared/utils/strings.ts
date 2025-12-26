// src/modules/shared/utils/strings.ts

export function safeTrim(v: unknown): string {
  return String(v ?? "").trim();
}
