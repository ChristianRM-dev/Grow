export function inferCustomerModeFromSystemKey(
  systemKey: string | null | undefined,
): "PUBLIC" | "PARTY" {
  const key = (systemKey ?? "").toUpperCase();
  if (key === "PUBLIC" || key === "WALK_IN_PUBLIC" || key === "WALKIN_PUBLIC") {
    return "PUBLIC";
  }

  return "PARTY";
}

export function splitSnapshot(snapshot: string | null | undefined): {
  name: string;
  description: string;
} {
  const normalizedSnapshot = String(snapshot ?? "").trim();
  if (!normalizedSnapshot) return { name: "", description: "" };

  const separator = " — ";
  const separatorIndex = normalizedSnapshot.indexOf(separator);
  if (separatorIndex < 0) {
    return { name: normalizedSnapshot, description: "" };
  }

  return {
    name: normalizedSnapshot.slice(0, separatorIndex).trim(),
    description: normalizedSnapshot
      .slice(separatorIndex + separator.length)
      .trim(),
  };
}

export function descriptionFromSnapshotForRegisteredLine(
  snapshot: string | null | undefined,
  productName: string | null | undefined,
): string {
  const normalizedSnapshot = String(snapshot ?? "").trim();
  const normalizedProductName = String(productName ?? "").trim();
  if (!normalizedSnapshot) return "";

  const separator = " — ";
  const prefix = normalizedProductName
    ? `${normalizedProductName}${separator}`
    : "";

  if (prefix && normalizedSnapshot.startsWith(prefix)) {
    return normalizedSnapshot.slice(prefix.length).trim();
  }

  return splitSnapshot(normalizedSnapshot).description || "";
}

export function getSnapshotDisplayParts(snapshot: string | null | undefined) {
  const normalizedSnapshot = String(snapshot ?? "").trim();
  const { name, description } = splitSnapshot(normalizedSnapshot);

  return {
    name,
    description,
    displayName: name || normalizedSnapshot || "—",
    displayDescription: description || "—",
  };
}
