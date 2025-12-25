import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { signOutCommand } from "@/modules/auth/actions/signOut.command";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Force Next to treat this layout as request-bound (cookies available).
  cookies();

  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="drawer lg:drawer-open min-h-screen">
      <input id="app-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col">
        <header className="navbar bg-base-100 border-b border-base-300">
          <div className="flex-none lg:hidden">
            <label
              htmlFor="app-drawer"
              className="btn btn-ghost btn-square"
              aria-label="Abrir menú"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </label>
          </div>

          <div className="flex-1">
            <Link href="/dashboard" className="btn btn-ghost text-lg">
              Grow
            </Link>
          </div>

          <div className="flex-none gap-2">
            <div className="badge badge-outline">
              {session.user.email ?? "Usuario"}
            </div>
            <form action={signOutCommand}>
              <button className="btn btn-ghost" type="submit">
                Cerrar sesión
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>

        <footer className="footer footer-center bg-base-100 border-t border-base-300 p-4">
          <aside>
            <p className="text-sm opacity-75">
              © {new Date().getFullYear()} Grow — Panel interno
            </p>
          </aside>
        </footer>
      </div>

      <aside className="drawer-side">
        <label htmlFor="app-drawer" className="drawer-overlay" />
        <div className="bg-base-200 w-72 min-h-full border-r border-base-300">
          <ul className="menu px-3 py-4">
            <li>
              <Link href="/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link href="/products">Productos</Link>
            </li>
            <li>
              <Link href="/sale-notes">Nodas de venta</Link>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
