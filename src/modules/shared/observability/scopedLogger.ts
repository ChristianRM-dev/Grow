// src/modules/shared/observability/scopedLogger.ts

export type UseCaseContext = { traceId?: string };

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
