"use client";

import React from "react";
import Link from "next/link";
import { HomeIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

import type { BreadcrumbItem } from "./Breadcrumbs.types";
import { routes } from "@/lib/routes";

export function Breadcrumbs({
  items,
  showHomeLabel = false,
  homeLabel = "Inicio",
  className,
}: {
  items: BreadcrumbItem[];
  showHomeLabel?: boolean;
  homeLabel?: string; // Spanish UI label by default.
  className?: string;
}) {
  // DaisyUI breadcrumbs uses <ul><li>... with separators handled by CSS.
  // We still add a Chevron icon for clarity/consistency with Heroicons.
  return (
    <div className={`breadcrumbs text-sm ${className ?? ""}`}>
      <ul>
        <li>
          <Link href={routes.home()} className="inline-flex items-center gap-2">
            <HomeIcon className="h-4 w-4" aria-hidden="true" />
            {showHomeLabel ? <span>{homeLabel}</span> : null}
          </Link>
        </li>

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const content = (
            <span className="inline-flex items-center gap-2">
              <ChevronRightIcon
                className="h-4 w-4 opacity-60"
                aria-hidden="true"
              />
              {item.icon ? (
                <span className="inline-flex">{item.icon}</span>
              ) : null}
              <span className={isLast ? "font-semibold" : undefined}>
                {item.label}
              </span>
            </span>
          );

          return (
            <li
              key={`${item.label}-${idx}`}
              aria-current={isLast ? "page" : undefined}
            >
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:underline">
                  {content}
                </Link>
              ) : (
                <span>{content}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
