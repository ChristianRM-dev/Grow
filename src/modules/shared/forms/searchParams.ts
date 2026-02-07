export type SearchParams = Record<string, string | string[] | undefined>

export function getSearchParamString(
  params: SearchParams | undefined,
  key: string
): string | null {
  const value = params?.[key]

  if (typeof value === "string") return value
  if (Array.isArray(value)) return value[0] ?? null

  return null
}
