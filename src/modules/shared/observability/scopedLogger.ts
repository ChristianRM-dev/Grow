// src/modules/shared/observability/scopedLogger.ts

import { UserRole } from "@/generated/prisma/client";
import { emitLog } from "@/modules/shared/observability/logging.shared";

export type UseCaseContext = {
  traceId?: string;
  user?: {
    id: string;
    name?: string | null;
    role?: UserRole | null;
  };
};

export type Logger = {
  log: (message: string, extra?: unknown) => void;
  debug: (message: string, extra?: unknown) => void;
  info: (message: string, extra?: unknown) => void;
  warn: (message: string, extra?: unknown) => void;
  error: (message: string, extra?: unknown) => void;
};

export function createScopedLogger(
  scope: string,
  ctx?: UseCaseContext
): Logger {
  const prefix = ctx?.traceId ? `[${scope}:${ctx.traceId}]` : `[${scope}]`;

  return {
    log(message, extra) {
      emitLog({ prefix, level: "debug", message, data: extra });
    },
    debug(message, extra) {
      emitLog({ prefix, level: "debug", message, data: extra });
    },
    info(message, extra) {
      emitLog({ prefix, level: "info", message, data: extra });
    },
    warn(message, extra) {
      emitLog({ prefix, level: "warn", message, data: extra });
    },
    error(message, extra) {
      emitLog({ prefix, level: "error", message, data: extra });
    },
  };
}
