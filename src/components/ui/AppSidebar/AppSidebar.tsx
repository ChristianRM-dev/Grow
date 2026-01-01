"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  ArrowRightStartOnRectangleIcon,
  HomeIcon,
  CubeIcon,
  DocumentTextIcon,
  UserCircleIcon,
  BanknotesIcon,
  TableCellsIcon,
} from "@heroicons/react/16/solid";

export type AppNavIcon =
  | "home"
  | "products"
  | "salesNotes"
  | "parties"
  | "supplierPurchases"
  | "quotations";

export type AppNavItem = {
  label: string; // Spanish UI
  href: string;
  icon: AppNavIcon;
  exact?: boolean;
};

const ICONS: Record<
  AppNavIcon,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  home: HomeIcon,
  products: CubeIcon,
  salesNotes: DocumentTextIcon,
  parties: UserCircleIcon,
  supplierPurchases: BanknotesIcon,
  quotations: TableCellsIcon,
};

function isActivePath(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({
  items,
  signOutAction,
}: {
  items: AppNavItem[];
  signOutAction: (formData: FormData) => Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <aside className="bg-base-200 w-60 min-h-full border-r border-base-300 flex flex-col">
      <div className="px-3 py-4">
        <ul className="menu w-full p-1 gap-1">
          {items.map((item) => {
            const active = isActivePath(pathname, item.href, item.exact);
            const Icon = ICONS[item.icon];

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex items-center gap-3 rounded-lg px-3 py-2",
                    "transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-200",
                    active
                      ? "bg-base-300 text-primary font-semibold border-l-4 border-primary pl-2"
                      : "text-base-content/80 hover:bg-base-300 hover:text-base-content border-l-4 border-transparent pl-2",
                  ].join(" ")}
                >
                  <Icon
                    className={[
                      "h-4 w-4",
                      active ? "text-primary" : "text-base-content/60",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-auto px-3 pb-4">
        <div className="divider my-2" />
        <form action={signOutAction}>
          <button
            type="submit"
            className="btn btn-ghost w-full justify-start gap-3 text-base-content/80 hover:text-base-content"
          >
            <ArrowRightStartOnRectangleIcon
              className="h-4 w-4 text-base-content/60"
              aria-hidden="true"
            />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
