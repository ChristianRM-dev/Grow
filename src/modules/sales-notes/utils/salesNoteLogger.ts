/**
 * Sales Note Flow Logger
 *
 * Structured logging utility for debugging the Sales Notes creation/edit flow.
 * All logs are gated behind the NEXT_PUBLIC_DEBUG_SALES_FLOW environment variable.
 *
 * Usage:
 *   import { salesNoteLogger } from "@/modules/sales-notes/utils/salesNoteLogger";
 *   salesNoteLogger.info("ComponentName", "Event description", { contextData });
 *
 * Enable logging by setting NEXT_PUBLIC_DEBUG_SALES_FLOW=true in .env.local
 */

const PREFIX = "[SALES_NOTE_FLOW]";

function isEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEBUG_SALES_FLOW === "true"
}

function timestamp(): string {
  return new Date().toISOString();
}

/**
 * Summarize data to avoid logging large objects.
 * Keeps top-level keys but truncates arrays and nested objects.
 */
function summarize(data: unknown): unknown {
  if (data === undefined || data === null) return data;
  if (typeof data !== "object") return data;
  if (data instanceof Error) {
    return { message: data.message, stack: data.stack?.split("\n").slice(0, 5).join("\n") };
  }
  if (Array.isArray(data)) {
    return `[Array(${data.length})]`;
  }
  return data;
}

export const salesNoteLogger = {
  info(component: string, message: string, data?: unknown): void {
    if (!isEnabled()) return;
    const ts = timestamp();
    if (data !== undefined) {
      console.log(`${PREFIX}[${component}] ${message}`, { ts, ...((typeof data === "object" && data !== null) ? data as Record<string, unknown> : { value: data }) });
    } else {
      console.log(`${PREFIX}[${component}] ${message}`, { ts });
    }
  },

  warn(component: string, message: string, data?: unknown): void {
    if (!isEnabled()) return;
    const ts = timestamp();
    if (data !== undefined) {
      console.warn(`${PREFIX}[${component}] ${message}`, { ts, ...((typeof data === "object" && data !== null) ? data as Record<string, unknown> : { value: data }) });
    } else {
      console.warn(`${PREFIX}[${component}] ${message}`, { ts });
    }
  },

  error(component: string, message: string, data?: unknown): void {
    if (!isEnabled()) return;
    const ts = timestamp();
    if (data !== undefined) {
      console.error(`${PREFIX}[${component}] ${message}`, { ts, detail: summarize(data) });
    } else {
      console.error(`${PREFIX}[${component}] ${message}`, { ts });
    }
  },

  debug(component: string, message: string, data?: unknown): void {
    if (!isEnabled()) return;
    const ts = timestamp();
    if (data !== undefined) {
      console.debug(`${PREFIX}[${component}] ${message}`, { ts, ...((typeof data === "object" && data !== null) ? data as Record<string, unknown> : { value: data }) });
    } else {
      console.debug(`${PREFIX}[${component}] ${message}`, { ts });
    }
  },
};
