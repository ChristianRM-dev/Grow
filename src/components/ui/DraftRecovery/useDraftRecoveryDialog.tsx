/**
 * useDraftRecoveryDialog Hook
 *
 * Helper hook for showing draft recovery dialogs using BlockingDialogsProvider.
 * Provides a consistent UX for asking users if they want to restore saved drafts.
 *
 * @example
 * ```typescript
 * const { showRecoveryDialog } = useDraftRecoveryDialog();
 *
 * const shouldRestore = await showRecoveryDialog('2026-01-16T10:30:00Z');
 * if (shouldRestore) {
 *   form.reset(draft);
 * } else {
 *   clearDraft();
 * }
 * ```
 */

import { useCallback } from "react";
import { DateTime } from "luxon";

import { useBlockingDialogs } from "@/components/ui/Dialogs/BlockingDialogsProvider";

/**
 * Options for showing draft recovery dialog
 */
export interface DraftRecoveryDialogOptions {
  /**
   * ISO timestamp when draft was saved
   */
  timestamp: string;

  /**
   * Custom title for the dialog
   * @default "Borrador encontrado"
   */
  title?: string;

  /**
   * Custom message to show
   * If not provided, a default message is shown
   */
  message?: React.ReactNode;

  /**
   * Additional context to show (e.g., form name)
   */
  context?: string;

  /**
   * Custom label for restore button
   * @default "Restaurar borrador"
   */
  restoreLabel?: string;

  /**
   * Custom label for discard button
   * @default "Descartar borrador"
   */
  discardLabel?: string;

  /**
   * Whether to allow closing with Esc key
   * @default true
   */
  allowEscClose?: boolean;

  /**
   * Custom icon to show
   */
  icon?: React.ReactNode;
}

/**
 * Return type of useDraftRecoveryDialog
 */
export interface UseDraftRecoveryDialogReturn {
  /**
   * Show recovery dialog and wait for user decision
   * @returns Promise that resolves to true if user wants to restore, false if discard
   */
  showRecoveryDialog: (
    options: string | DraftRecoveryDialogOptions
  ) => Promise<boolean>;
}

/**
 * Format timestamp to human-readable relative time in Spanish
 */
function formatTimeAgo(timestamp: string): string {
  try {
    const dt = DateTime.fromISO(timestamp);
    if (!dt.isValid) {
      return "hace un momento";
    }

    const now = DateTime.now();
    const diff = now.diff(dt, ["years", "months", "days", "hours", "minutes"]);

    if (diff.years >= 1) {
      const years = Math.floor(diff.years);
      return `hace ${years} ${years === 1 ? "año" : "años"}`;
    }

    if (diff.months >= 1) {
      const months = Math.floor(diff.months);
      return `hace ${months} ${months === 1 ? "mes" : "meses"}`;
    }

    if (diff.days >= 1) {
      const days = Math.floor(diff.days);
      return `hace ${days} ${days === 1 ? "día" : "días"}`;
    }

    if (diff.hours >= 1) {
      const hours = Math.floor(diff.hours);
      return `hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
    }

    if (diff.minutes >= 1) {
      const minutes = Math.floor(diff.minutes);
      return `hace ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
    }

    return "hace un momento";
  } catch {
    return "hace un momento";
  }
}

/**
 * Hook for showing draft recovery dialogs
 */
export function useDraftRecoveryDialog(): UseDraftRecoveryDialogReturn {
  const dialogs = useBlockingDialogs();

  const showRecoveryDialog = useCallback(
    async (options: string | DraftRecoveryDialogOptions): Promise<boolean> => {
      // Handle simple timestamp string
      const config: DraftRecoveryDialogOptions =
        typeof options === "string" ? { timestamp: options } : options;

      const {
        timestamp,
        title = "Borrador encontrado",
        message,
        context,
        restoreLabel = "Restaurar borrador",
        discardLabel = "Descartar borrador",
        allowEscClose = true,
        icon,
      } = config;

      // Format timestamp to human-readable string
      const timeAgo = formatTimeAgo(timestamp);

      // Build message
      const dialogMessage = message || (
        <div className="space-y-3">
          <p>
            Se encontró{" "}
            {context ? `un borrador de ${context}` : "un borrador sin guardar"}.
          </p>
          <div className="flex items-center gap-2 text-sm opacity-70">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Guardado {timeAgo}</span>
          </div>
          <p className="text-sm opacity-70">
            ¿Deseas continuar editando el borrador o descartarlo y empezar de
            nuevo?
          </p>
        </div>
      );

      // Default icon (AlertCircle)
      const dialogIcon = icon || (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      );

      // Show confirmation dialog
      const confirmed = await dialogs.confirm({
        preset: "info",
        title,
        message: dialogMessage,
        allowEscClose,
        labels: {
          confirmText: restoreLabel,
          cancelText: discardLabel,
        },
        iconOptions: {
          icon: dialogIcon,
        },
      });

      return confirmed;
    },
    [dialogs]
  );

  return {
    showRecoveryDialog,
  };
}
