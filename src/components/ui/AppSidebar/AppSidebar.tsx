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
} from "@heroicons/react/16/solid";

export type AppNavIcon =
  | "home"
  | "products"
  | "salesNotes"
  | "parties"
  | "supplierPurchases";

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
    <div className="bg-base-200 w-72 min-h-full border-r border-base-300 flex flex-col">
      <div className="px-3 py-4">
        <ul className="menu w-full">
          {items.map((item) => {
            const active = isActivePath(pathname, item.href, item.exact);
            const Icon = ICONS[item.icon];

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[
                    "flex items-center gap-3",
                    active ? "active font-semibold" : "",
                  ].join(" ")}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
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
            className="btn btn-ghost w-full justify-start gap-3"
          >
            <ArrowRightStartOnRectangleIcon
              className="h-4 w-4"
              aria-hidden="true"
            />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </div>
  );
}
