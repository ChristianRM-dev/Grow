"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/16/solid";

type Props = {
  title?: string;
  description?: string;

  /** Breadcrumbs ya renderizados (tu componente Breadcrumbs). */
  breadcrumbs: React.ReactNode;

  /** Contenido (tu form/wizard ya tiene sus propios controles). */
  children: React.ReactNode;

  /**
   * Muestra botón "Volver".
   * - Si backHref existe: navega a esa ruta.
   * - Si no existe: usa router.back().
   */
  showBack?: boolean;
  backHref?: string;

  /** Etiqueta accesible / tooltip del botón volver (en español). */
  backLabel?: string;

  /**
   * Slot opcional para acciones de la página (ej: botones arriba a la derecha).
   * No obligatorio, pero útil si luego quieres "Guardar" / "Cancelar" en el header.
   */
  headerActions?: React.ReactNode;

  className?: string;
};

export function FormPageLayout({
  title,
  description,
  breadcrumbs,
  children,
  showBack = true,
  backHref,
  backLabel = "Volver",
  headerActions,
  className,
}: Props) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <div className={`w-full p-4 ${className ?? ""}`}>
      <div className="flex flex-col gap-3">
        {/* Top row: back + breadcrumbs + optional actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {showBack ? (
              backHref ? (
                <Link
                  href={backHref}
                  className="btn btn-ghost btn-sm"
                  aria-label={backLabel}
                  title={backLabel}
                >
                  <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
                </Link>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleBack}
                  aria-label={backLabel}
                  title={backLabel}
                >
                  <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              )
            ) : null}

            <div>{breadcrumbs}</div>
          </div>

          {headerActions ? (
            <div className="shrink-0">{headerActions}</div>
          ) : null}
        </div>

        {title || description ? (
          <div className="mt-1">
            {title ? <h1 className="text-xl font-semibold">{title}</h1> : null}
            {description ? (
              <p className="mt-1 text-sm opacity-70">{description}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-4">{children}</div>
    </div>
  );
}
