import { handlers } from "@/auth";

export const { GET, POST } = handlers;

// Optional explicit runtime (safe for Prisma + DB sessions).
export const runtime = "nodejs";
