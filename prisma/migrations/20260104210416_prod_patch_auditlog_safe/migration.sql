-- Safe patch for production DB drift (AuditLog/AuditLogChange)

-- 1) Enum value (avoid failure if it already exists)
DO $$ BEGIN
  ALTER TYPE "AuditChangeKey" ADD VALUE 'PAYMENT_OCCURRED_AT';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) Add missing columns used by current Prisma client
ALTER TABLE "AuditLog"
  ADD COLUMN IF NOT EXISTS "actorNameSnapshot" TEXT,
  ADD COLUMN IF NOT EXISTS "actorRoleSnapshot" "UserRole";

-- 3) Align nullability expected by current schema
ALTER TABLE "AuditLog"
  ALTER COLUMN "rootEntityType" SET NOT NULL,
  ALTER COLUMN "rootEntityId" SET NOT NULL,
  ALTER COLUMN "occurredAt" DROP NOT NULL;

-- 4) Remove obsolete column if present (optional but safe)
ALTER TABLE "AuditLogChange"
  DROP COLUMN IF EXISTS "createdAt";

-- 5) Index used by queries (safe)
CREATE INDEX IF NOT EXISTS "AuditLogChange_key_idx" ON "AuditLogChange"("key");

-- 6) FK constraint (safe)
DO $$ BEGIN
  ALTER TABLE "AuditLog"
    ADD CONSTRAINT "AuditLog_actorUserId_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
