import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { auth } from "@/auth";
import { routes } from "@/lib/routes";
import { signOutCommand } from "@/modules/auth/actions/signOut.command";

import {
  AppSidebar,
  type AppNavItem,
} from "@/components/ui/AppSidebar/AppSidebar";
import { Bars3Icon } from "@heroicons/react/16/solid";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AppLayout({ children }: { children: ReactNode }) {
  cookies();

  const session = await auth();
  if (!session?.user) {
    redirect(routes.login());
  }

  const navItems: AppNavItem[] = [
    { label: "Dashboard", href: routes.dashboard(), icon: "home", exact: true },
    { label: "Terceros", href: routes.parties.list(), icon: "parties" },
    {
      label: "Compras",
      href: routes.supplierPurchases.list(),
      icon: "supplierPurchases",
    },
    { label: "Productos", href: routes.products.list(), icon: "products" },
    {
      label: "Notas de venta",
      href: routes.salesNotes.list(),
      icon: "salesNotes",
    },
  ];

  return (
    <div className="drawer lg:drawer-open min-h-screen">
      <input id="app-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col">
        {/* Mobile-only toggle */}
        <div className="lg:hidden sticky top-0 z-40 bg-base-100 border-b border-base-300">
          <div className="p-2">
            <label
              htmlFor="app-drawer"
              className="btn btn-ghost btn-square"
              aria-label="Abrir menú"
              title="Abrir menú"
            >
              <Bars3Icon className="h-5 w-5" aria-hidden="true" />
            </label>
          </div>
        </div>

        <main className="flex-1">{children}</main>
      </div>

      <aside className="drawer-side">
        <label htmlFor="app-drawer" className="drawer-overlay" />
        <AppSidebar items={navItems} signOutAction={signOutCommand} />
      </aside>
    </div>
  );
}
