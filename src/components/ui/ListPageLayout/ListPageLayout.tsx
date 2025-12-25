"use client";

import React from "react";
import { useRouter } from "next/navigation";

type Props = {
  title?: string;
  description?: string;
  children: React.ReactNode;

  /**
   * Si se proporciona, navega a esta ruta al hacer clic en el FAB.
   */
  createRoute?: string;

  /**
   * Callback opcional que se ejecuta antes de la navegación.
   */
  onCreate?: () => void;

  /**
   * Label opcional para el botón.
   */
  fabLabel?: string;
};

export function ListPageLayout({
  title,
  description,
  children,
  onCreate,
  createRoute,
  fabLabel = "Nuevo",
}: Props) {
  const router = useRouter();

  const handleCreate = () => {
    // Ejecuta el callback si existe
    if (onCreate) {
      onCreate();
    }

    // Navega si se proporcionó una ruta
    if (createRoute) {
      router.push(createRoute);
    }
  };

  // El botón se muestra si hay una ruta o una función onCreate
  const showFab = !!createRoute || !!onCreate;

  return (
    <div className="relative w-full p-4">
      {(title || description) && (
        <div className="mb-4">
          {title ? <h1 className="text-xl font-semibold">{title}</h1> : null}
          {description ? (
            <p className="mt-1 text-sm opacity-70">{description}</p>
          ) : null}
        </div>
      )}

      {children}

      {showFab && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="tooltip tooltip-left" data-tip={fabLabel}>
            <button
              type="button"
              className="btn btn-primary btn-circle shadow-lg"
              onClick={handleCreate}
              aria-label={fabLabel}
              title={fabLabel}
            >
              {/* Plus icon */}
              <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M19 11H13V5h-2v6H5v2h6v6h2v-6h6z"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
