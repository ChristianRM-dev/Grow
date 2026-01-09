// src/modules/shared/pdf/readPublicImageAsDataUri.ts
import fs from "node:fs/promises";
import path from "node:path";

function guessMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

export async function readPublicImageAsDataUri(
  publicPath: string
): Promise<string | null> {
  // publicPath example: "/brand/laureles-logo.png"
  const normalized = publicPath.startsWith("/")
    ? publicPath.slice(1)
    : publicPath;

  const absPath = path.join(process.cwd(), "public", normalized);

  try {
    const buf = await fs.readFile(absPath);
    const mime = guessMimeType(absPath);
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    // If the file doesn't exist, return null to avoid breaking PDF render.
    return null;
  }
}
