"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  AlertDialogOptions,
  ConfirmDialogOptions,
  DialogPreset,
  DialogRequest,
  DialogTone,
} from "./dialog.types";
import { resolvePresetConfig } from "./dialogPresets";

type DialogResult =
  | { type: "confirm"; confirmed: boolean }
  | { type: "alert"; acknowledged: true };

type DialogApi = {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  alert: (options: AlertDialogOptions) => Promise<void>;

  // Common presets (typos comuns)
  error: (options: Omit<AlertDialogOptions, "preset">) => Promise<void>;
  warning: (options: Omit<AlertDialogOptions, "preset">) => Promise<void>;
  success: (options: Omit<AlertDialogOptions, "preset">) => Promise<void>;
  info: (options: Omit<AlertDialogOptions, "preset">) => Promise<void>;

  // Topical helper: delete resource (your main case)
  confirmDelete: (options: {
    resourceLabel: string; // Spanish UI text (e.g., "producto", "cliente", "cotización")
    message?: React.ReactNode; // Spanish UI text override
    details?: string | null;
    confirmText?: string; // Spanish UI text override
    cancelText?: string; // Spanish UI text override
    allowEscClose?: boolean;
    icon?: React.ReactNode;
  }) => Promise<boolean>;
};

const BlockingDialogsContext = createContext<DialogApi | null>(null);

function createId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toneToButtonClass(tone: DialogTone): string {
  switch (tone) {
    case "danger":
      return "btn-error";
    case "warning":
      return "btn-warning";
    case "success":
      return "btn-success";
    default:
      return "btn-primary";
  }
}

function toneToTitleClass(tone: DialogTone): string {
  switch (tone) {
    case "danger":
      return "text-error";
    case "warning":
      return "text-warning";
    case "success":
      return "text-success";
    default:
      return "";
  }
}

function toneToIconClass(tone: DialogTone): string {
  // DaisyUI text colors for icon
  switch (tone) {
    case "danger":
      return "text-error";
    case "warning":
      return "text-warning";
    case "success":
      return "text-success";
    default:
      return "text-info";
  }
}

function buildRequest(args: {
  kind: "confirm" | "alert";
  preset: DialogPreset;
  title?: string;
  message: React.ReactNode;
  details?: string | null;
  allowEscClose?: boolean;
  toneOverride?: DialogTone;
  labels?: { confirmText?: string; cancelText?: string };
  iconOptions?: { icon?: React.ReactNode; hideIcon?: boolean };
}): DialogRequest {
  const presetConfig = resolvePresetConfig(args.preset);

  const tone = args.toneOverride ?? presetConfig.tone;

  const labels = {
    confirmText:
      args.labels?.confirmText ?? presetConfig.defaultLabels.confirmText,
    cancelText:
      args.labels?.cancelText ?? presetConfig.defaultLabels.cancelText,
  };

  const icon =
    args.iconOptions?.hideIcon === true
      ? null
      : args.iconOptions?.icon ?? presetConfig.defaultIcon;

  return {
    id: createId(),
    kind: args.kind,
    preset: args.preset,
    tone,
    title: args.title ?? presetConfig.defaultTitle,
    message: args.message,
    details: args.details ?? null,
    labels,
    icon,
    allowEscClose: args.allowEscClose ?? true,
  };
}

export function BlockingDialogsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queueRef = useRef<DialogRequest[]>([]);
  const resolverRef = useRef<((result: DialogResult) => void) | null>(null);

  const [active, setActive] = useState<DialogRequest | null>(null);

  const showNext = useCallback(() => {
    if (active) return;
    const next = queueRef.current.shift() ?? null;
    setActive(next);
  }, [active]);

  const enqueue = useCallback((req: DialogRequest) => {
    queueRef.current.push(req);
    setActive((current) => current ?? queueRef.current.shift() ?? null);
  }, []);

  const closeWith = useCallback((result: DialogResult) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setActive(null);
    resolve?.(result);
  }, []);

  useEffect(() => {
    if (!active) showNext();
  }, [active, showNext]);

  const confirm = useCallback(
    (options: ConfirmDialogOptions) => {
      const req = buildRequest({
        kind: "confirm",
        preset: options.preset ?? "confirm",
        toneOverride: options.toneOverride,
        title: options.title,
        message: options.message,
        details: options.details,
        allowEscClose: options.allowEscClose,
        labels: options.labels,
        iconOptions: options.iconOptions,
      });

      return new Promise<boolean>((resolve) => {
        enqueue(req);
        resolverRef.current = (result) => {
          if (result.type !== "confirm") return resolve(false);
          resolve(result.confirmed);
        };
      });
    },
    [enqueue]
  );

  const alert = useCallback(
    (options: AlertDialogOptions) => {
      const req = buildRequest({
        kind: "alert",
        preset: options.preset ?? "info",
        toneOverride: options.toneOverride,
        title: options.title,
        message: options.message,
        details: options.details,
        allowEscClose: options.allowEscClose,
        labels: options.labels,
        iconOptions: options.iconOptions,
      });

      return new Promise<void>((resolve) => {
        enqueue(req);
        resolverRef.current = (result) => {
          if (result.type !== "alert") return resolve();
          resolve();
        };
      });
    },
    [enqueue]
  );

  const api = useMemo<DialogApi>(
    () => ({
      confirm,
      alert,
      error: (o) => alert({ ...o, preset: "error" }),
      warning: (o) => alert({ ...o, preset: "warning" }),
      success: (o) => alert({ ...o, preset: "success" }),
      info: (o) => alert({ ...o, preset: "info" }),

      confirmDelete: async (o) => {
        return confirm({
          preset: "confirm",
          toneOverride: "danger",
          title: `Eliminar ${o.resourceLabel}`,
          message: o.message ?? "Esta acción no se puede deshacer.",
          details: o.details ?? null,
          allowEscClose: o.allowEscClose ?? true,
          labels: {
            confirmText: o.confirmText ?? "Eliminar",
            cancelText: o.cancelText ?? "Cancelar",
          },
          iconOptions: {
            icon: o.icon,
          },
        });
      },
    }),
    [alert, confirm]
  );

  return (
    <BlockingDialogsContext.Provider value={api}>
      {children}
      <BlockingDialogHost active={active} onClose={closeWith} />
    </BlockingDialogsContext.Provider>
  );
}

export function useBlockingDialogs(): DialogApi {
  const ctx = useContext(BlockingDialogsContext);
  if (!ctx)
    throw new Error(
      "useBlockingDialogs must be used within BlockingDialogsProvider"
    );
  return ctx;
}

function BlockingDialogHost({
  active,
  onClose,
}: {
  active: DialogRequest | null;
  onClose: (result: DialogResult) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const primaryBtnRef = useRef<HTMLButtonElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    if (active) {
      if (!el.open) el.showModal();

      const focusCancel = active.kind === "confirm" && active.tone === "danger";
      queueMicrotask(() => {
        (focusCancel ? cancelBtnRef.current : primaryBtnRef.current)?.focus();
      });
    } else {
      if (el.open) el.close();
    }
  }, [active]);

  const titleId = active ? `dlg-title-${active.id}` : undefined;
  const descId = active ? `dlg-desc-${active.id}` : undefined;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!active) return;

    if (e.key === "Escape" && active.allowEscClose) {
      e.preventDefault();
      if (active.kind === "confirm")
        onClose({ type: "confirm", confirmed: false });
      else onClose({ type: "alert", acknowledged: true });
    }

    if (e.key === "Enter" && active.kind === "confirm") {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isFormField =
        tag === "textarea" || tag === "input" || tag === "select";
      if (!isFormField) {
        e.preventDefault();
        onClose({ type: "confirm", confirmed: true });
      }
    }
  };

  const handleBackdropClick = () => {
    if (!active) return;
    if (!active.allowEscClose) return;

    if (active.kind === "confirm")
      onClose({ type: "confirm", confirmed: false });
    else onClose({ type: "alert", acknowledged: true });
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onKeyDown={handleKeyDown}
      onCancel={(e) => e.preventDefault()} // avoid double-close; we handle Esc ourselves
    >
      <div className="modal-box">
        {active ? (
          <>
            <div className="flex items-start gap-3">
              {active.icon ? (
                <div className={`mt-0.5 ${toneToIconClass(active.tone)}`}>
                  {active.icon}
                </div>
              ) : null}

              <div className="min-w-0 flex-1">
                <h3
                  id={titleId}
                  className={`font-bold text-lg ${toneToTitleClass(
                    active.tone
                  )}`}
                >
                  {active.title}
                </h3>

                <div id={descId} className="pt-3 space-y-3">
                  <div className="text-sm">{active.message}</div>

                  {active.details ? (
                    <details className="collapse collapse-arrow border border-base-300 bg-base-200">
                      <summary className="collapse-title text-sm font-medium">
                        Detalles técnicos
                      </summary>
                      <div className="collapse-content">
                        <pre className="text-xs whitespace-pre-wrap">
                          {active.details}
                        </pre>
                      </div>
                    </details>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="modal-action">
              {active.kind === "confirm" ? (
                <>
                  <button
                    ref={cancelBtnRef}
                    type="button"
                    className="btn"
                    onClick={() =>
                      onClose({ type: "confirm", confirmed: false })
                    }
                  >
                    {active.labels.cancelText}
                  </button>

                  <button
                    ref={primaryBtnRef}
                    type="button"
                    className={`btn ${toneToButtonClass(active.tone)}`}
                    onClick={() =>
                      onClose({ type: "confirm", confirmed: true })
                    }
                  >
                    {active.labels.confirmText}
                  </button>
                </>
              ) : (
                <button
                  ref={primaryBtnRef}
                  type="button"
                  className={`btn ${toneToButtonClass(active.tone)}`}
                  onClick={() => onClose({ type: "alert", acknowledged: true })}
                >
                  {active.labels.confirmText}
                </button>
              )}
            </div>
          </>
        ) : null}
      </div>

      <form method="dialog" className="modal-backdrop">
        <button type="button" aria-label="Cerrar" onClick={handleBackdropClick}>
          cerrar
        </button>
      </form>
    </dialog>
  );
}
