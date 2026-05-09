/**
 * Sales Note Flow Logger
 *
 * Structured logging utility for debugging the Sales Notes creation/edit flow.
 * Verbose logs are gated behind NEXT_PUBLIC_DEBUG_SALES_FLOW or
 * NEXT_PUBLIC_DEBUG_OBSERVABILITY. Warnings and errors stay visible.
 *
 * Usage:
 *   import { salesNoteLogger } from "@/modules/sales-notes/utils/salesNoteLogger";
 *   salesNoteLogger.info("ComponentName", "Event description", { contextData });
 *
 * Enable verbose logging by setting NEXT_PUBLIC_DEBUG_SALES_FLOW=true
 * or NEXT_PUBLIC_DEBUG_OBSERVABILITY=true in .env.local.
 */

import { emitLog } from "@/modules/shared/observability/logging.shared";

const PREFIX = "[SALES_NOTE_FLOW]";

export const salesNoteLogger = {
  info(component: string, message: string, data?: unknown): void {
    emitLog({
      prefix: `${PREFIX}[${component}]`,
      level: "info",
      message,
      data,
    });
  },

  warn(component: string, message: string, data?: unknown): void {
    emitLog({
      prefix: `${PREFIX}[${component}]`,
      level: "warn",
      message,
      data,
    });
  },

  error(component: string, message: string, data?: unknown): void {
    emitLog({
      prefix: `${PREFIX}[${component}]`,
      level: "error",
      message,
      data,
    });
  },

  debug(component: string, message: string, data?: unknown): void {
    emitLog({
      prefix: `${PREFIX}[${component}]`,
      level: "debug",
      message,
      data,
    });
  },
};
