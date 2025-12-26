"use client";

import React, { createContext, useContext, useSyncExternalStore } from "react";
import { toastStore } from "./toastStore";
import type { ToastItem } from "./toast.types";

type ToastContextValue = {
  dismiss: (id: string) => void;
  clear: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function variantToAlertClass(variant: ToastItem["variant"]) {
  switch (variant) {
    case "success":
      return "alert-success";
    case "error":
      return "alert-error";
    case "warning":
      return "alert-warning";
    case "info":
    default:
      return "alert-info";
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toasts = useSyncExternalStore(
    (listener) => toastStore.subscribe(listener),
    () => toastStore.getSnapshot(),
    () => [] as ToastItem[]
  );

  const value: ToastContextValue = {
    dismiss: (id) => toastStore.dismiss(id),
    clear: () => toastStore.clear(),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* DaisyUI toast container */}
      <div className="toast toast-top toast-end z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`alert ${variantToAlertClass(t.variant)} shadow`}
          >
            <div className="flex flex-col">
              {t.title ? (
                <span className="font-semibold">{t.title}</span>
              ) : null}
              <span>{t.message}</span>
            </div>

            {t.dismissible ? (
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => toastStore.dismiss(t.id)}
                aria-label="Cerrar notificación"
              >
                Cerrar
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToastControls() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToastControls must be used within <ToastProvider />");
  }
  return ctx;
}
