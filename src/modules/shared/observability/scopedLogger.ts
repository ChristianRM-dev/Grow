// src/modules/shared/observability/scopedLogger.ts

import { UserRole } from "@/generated/prisma/client";

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
};

export function createScopedLogger(
  scope: string,
  ctx?: UseCaseContext
): Logger {
  const prefix = ctx?.traceId ? `[${scope}:${ctx.traceId}]` : `[${scope}]`;

  return {
    log(message, extra) {
      if (extra !== undefined) console.log(prefix, message, extra);
      else console.log(prefix, message);
    },
  };
}
