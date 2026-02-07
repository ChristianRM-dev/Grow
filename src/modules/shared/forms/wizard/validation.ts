import type { FieldPath, FieldValues } from "react-hook-form"

export function mapArrayIssuePath<TValues extends FieldValues>(
  prefix: FieldPath<TValues>
) {
  return (issuePath: readonly PropertyKey[]) =>
    `${prefix}.${issuePath.map(String).join(".")}` as FieldPath<TValues>
}
