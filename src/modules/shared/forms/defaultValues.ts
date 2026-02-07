export function cloneFormDefaults<T>(defaults: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(defaults)
  }

  return JSON.parse(JSON.stringify(defaults)) as T
}
