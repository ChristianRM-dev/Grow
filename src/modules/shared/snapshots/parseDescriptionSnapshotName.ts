// src/modules/shared/snapshots/parseDescriptionSnapshotName.ts
export function parseDescriptionSnapshotName(snapshot: string): string {
  // NOTE: Some systems store JSON snapshots as string.
  // If it's plain text, we just return it.
  try {
    const obj = JSON.parse(snapshot) as any;
    const name = String(obj?.name ?? obj?.title ?? "").trim();
    return name.length > 0 ? name : snapshot;
  } catch {
    return snapshot;
  }
}
