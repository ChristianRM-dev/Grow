import type { ReactNode } from "react";

export type BreadcrumbItem = {
  label: string; // User-visible text should be Spanish (provided by caller).
  href?: string; // If omitted, renders as current / non-clickable item.
  icon?: ReactNode; // Optional icon for the item.
};
