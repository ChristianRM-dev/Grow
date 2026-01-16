"use client";
import Link from "next/link";
import { HomeIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-200 to-base-300 px-4">
      <div className="max-w-2xl w-full">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center p-8 sm:p-12">
            {/* Ilustración decorativa */}
            <div className="relative mb-6">
              <div className="w-32 h-32 bg-primary/10 rounded-full absolute -z-10 blur-xl"></div>
              <MagnifyingGlassIcon className="w-32 h-32 text-primary" />
            </div>

            {/* Error Code */}
            <div className="badge badge-primary badge-lg mb-4">Error 404</div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-base-content mb-3">
              ¡Ups! Página no encontrada
            </h1>

            {/* Description */}
            <p className="text-base-content/70 max-w-md mb-8">
              Parece que este recurso no existe, fue eliminado o la URL es
              incorrecta. Verifica la dirección o regresa al inicio.
            </p>

            {/* Divider */}
            <div className="divider my-2"></div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                href="/"
                className="btn btn-primary gap-2 flex-1 sm:flex-initial"
              >
                <HomeIcon className="w-5 h-5" />
                Ir al inicio
              </Link>

              <button
                onClick={() => window.history.back()}
                className="btn btn-outline flex-1 sm:flex-initial"
              >
                Volver atrás
              </button>
            </div>

            {/* Helpful links */}
            <div className="mt-8 pt-6 border-t border-base-300 w-full">
              <p className="text-sm text-base-content/60 mb-3">
                Enlaces útiles:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Link href="/sales-notes" className="link link-hover text-sm">
                  Notas de venta
                </Link>
                <span className="text-base-content/30">•</span>
                <Link
                  href="/supplier-purchases"
                  className="link link-hover text-sm"
                >
                  Compras
                </Link>
                <span className="text-base-content/30">•</span>
                <Link href="/parties" className="link link-hover text-sm">
                  Contactos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
