export type LogLevel = "debug" | "info" | "warn" | "error";

type EmitLogArgs = {
  prefix: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  force?: boolean;
};

const VERBOSE_LOG_FLAGS = [
  "DEBUG_OBSERVABILITY",
  "NEXT_PUBLIC_DEBUG_OBSERVABILITY",
  "NEXT_PUBLIC_DEBUG_SALES_FLOW",
] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function summarizeValue(value: unknown, depth = 0): unknown {
  if (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "bigint") return value.toString();

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack?.split("\n").slice(0, 5).join("\n"),
    };
  }

  if (Array.isArray(value)) {
    return `[Array(${value.length})]`;
  }

  if (!isPlainObject(value)) {
    return String(value);
  }

  if (depth >= 1) {
    return "[Object]";
  }

  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 20)
      .map(([key, entry]) => [key, summarizeValue(entry, depth + 1)]),
  );
}

export function isVerboseObservabilityEnabled(): boolean {
  return VERBOSE_LOG_FLAGS.some((flag) => process.env[flag] === "true");
}

export function summarizeForLog(data: unknown): unknown {
  return summarizeValue(data);
}

export function emitLog({
  prefix,
  level,
  message,
  data,
  force = false,
}: EmitLogArgs): void {
  const shouldEmit =
    force ||
    level === "warn" ||
    level === "error" ||
    isVerboseObservabilityEnabled();

  if (!shouldEmit) return;

  const method =
    level === "debug"
      ? console.debug
      : level === "info"
        ? console.info
        : level === "warn"
          ? console.warn
          : console.error;

  if (data === undefined) {
    method(`${prefix} ${message}`);
    return;
  }

  method(`${prefix} ${message}`, summarizeForLog(data));
}
