// src/modules/shared/prisma/errors.ts
import { Prisma } from "@/generated/prisma/client";

export function isUniqueConstraintError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

export function isRecordNotFoundError(err: unknown): boolean {
  // Prisma uses P2025 when update/delete fails because record doesn't exist
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025"
  );
}
