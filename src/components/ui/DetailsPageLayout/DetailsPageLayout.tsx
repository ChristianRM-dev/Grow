import React from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/16/solid";

import type {
  DetailsPageLayoutProps,
  DetailsBadgeVariant,
} from "./DetailsPageLayout.types";

function badgeClass(variant: DetailsBadgeVariant | undefined) {
  switch (variant) {
    case "success":
      return "badge-success";
    case "warning":
      return "badge-warning";
    case "error":
      return "badge-error";
    case "info":
      return "badge-info";
    case "neutral":
    default:
      return "badge-neutral";
  }
}

export function DetailsPageLayout({
  breadcrumbs,
  backHref,
  backLabel = "Volver",
  title,
  badge,
  subtitle,
  headerActions,
  children,
  className,
}: DetailsPageLayoutProps) {
  return (
    <div className={`w-full p-4 space-y-4 ${className ?? ""}`}>
      {/* Top row: back + breadcrumbs */}
      <div className="flex items-center gap-2">
        {backHref ? (
          <Link
            href={backHref}
            className="btn btn-ghost btn-sm"
            aria-label={backLabel}
            title={backLabel}
          >
            <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
          </Link>
        ) : null}

        <div>{breadcrumbs}</div>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{title}</h1>

            {badge ? (
              <span className={`badge ${badgeClass(badge.variant)}`}>
                {badge.label}
              </span>
            ) : null}
          </div>

          {subtitle ? (
            <div className="mt-1 text-sm opacity-70">{subtitle}</div>
          ) : null}
        </div>

        {headerActions ? (
          <div className="flex items-center gap-2 justify-end">
            {headerActions}
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="space-y-4">{children}</div>
    </div>
  );
}
