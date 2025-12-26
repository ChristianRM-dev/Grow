import type { ReactNode } from "react";

export type DetailsBadgeVariant =
  | "neutral"
  | "success"
  | "warning"
  | "error"
  | "info";

export type DetailsBadge = {
  label: string; // Spanish UI label by caller
  variant?: DetailsBadgeVariant;
};

export type DetailsPageLayoutProps = {
  breadcrumbs: ReactNode;

  /** Optional back button (recommended). */
  backHref?: string;
  backLabel?: string;

  /** Header main title and optional badge. */
  title: string;
  badge?: DetailsBadge;

  /** Optional subtitle/metadata line under title. */
  subtitle?: ReactNode;

  /** Right-side actions (buttons/links). */
  headerActions?: ReactNode;

  /** Page content. */
  children: ReactNode;

  className?: string;
};
