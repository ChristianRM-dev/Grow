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
  DocumentChartBarIcon,
  KeyIcon,
  ChevronUpIcon,
} from "@heroicons/react/16/solid";

export type AppNavIcon =
  | "home"
  | "products"
  | "salesNotes"
  | "parties"
  | "supplierPurchases"
  | "quotations"
  | "reports";

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
  reports: DocumentChartBarIcon,
};

function isActivePath(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({
  items,
  userName,
  userEmail,
  changePasswordHref,
  signOutAction,
}: {
  items: AppNavItem[];
  userName?: string | null;
  userEmail?: string | null;
  changePasswordHref: string;
  signOutAction: (formData: FormData) => Promise<void>;
}) {
  const pathname = usePathname();

  // Display name: prefer userName, fallback to email or "Usuario"
  const displayName = userName || userEmail || "Usuario";

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

      {/* User menu dropdown */}
      <div className="mt-auto px-3 pb-4">
        <div className="divider my-2" />

        <div className="dropdown dropdown-top w-full">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost w-full justify-between gap-2 text-base-content/80 hover:text-base-content normal-case"
          >
            <div className="flex items-center gap-2 min-w-0">
              <UserCircleIcon
                className="h-5 w-5 flex-shrink-0 text-base-content/60"
                aria-hidden="true"
              />
              <span className="truncate text-sm font-medium">
                {displayName}
              </span>
            </div>
            <ChevronUpIcon
              className="h-4 w-4 flex-shrink-0 text-base-content/60"
              aria-hidden="true"
            />
          </div>

          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52 mb-2 border border-base-300"
          >
            {/* Change password option */}
            <li>
              <Link
                href={changePasswordHref}
                className="flex items-center gap-3 px-3 py-2"
              >
                <KeyIcon
                  className="h-4 w-4 text-base-content/60"
                  aria-hidden="true"
                />
                <span>Cambiar contraseña</span>
              </Link>
            </li>

            <li className="menu-title">
              <span className="sr-only">Acciones</span>
            </li>

            {/* Sign out option */}
            <li>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex items-center gap-3 px-3 py-2 w-full text-left text-error hover:bg-error/10"
                >
                  <ArrowRightStartOnRectangleIcon
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                  <span>Cerrar sesión</span>
                </button>
              </form>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
