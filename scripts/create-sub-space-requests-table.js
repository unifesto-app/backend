// Temporary migration runner: creates the sub_space_request_type enum,
// the sub_space_requests table, and its indexes.
// Usage: node scripts/create-sub-space-requests-table.js
// Safe to re-run (uses IF NOT EXISTS / DO blocks).

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Creating sub_space_request_type enum...');
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sub_space_request_type') THEN
        CREATE TYPE "sub_space_request_type" AS ENUM ('JOIN_SUPER', 'CONVERT_AND_JOIN', 'CONVERT_TO_SUPER');
      END IF;
    END$$;
  `);

  console.log('Creating sub_space_requests table...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "sub_space_requests" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "request_type" "sub_space_request_type" NOT NULL,
      "sub_space_id" UUID,
      "target_space_id" UUID NOT NULL,
      "requested_by" UUID NOT NULL,
      "reason" TEXT NOT NULL,
      "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
      "review_note" TEXT,
      "reviewed_by" UUID,
      "reviewed_at" TIMESTAMPTZ(6),
      "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
      CONSTRAINT "sub_space_requests_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "sub_space_requests_sub_space_id_fkey" FOREIGN KEY ("sub_space_id") REFERENCES "spaces"("id") ON DELETE CASCADE,
      CONSTRAINT "sub_space_requests_target_space_id_fkey" FOREIGN KEY ("target_space_id") REFERENCES "spaces"("id") ON DELETE CASCADE,
      CONSTRAINT "sub_space_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id")
    );
  `);

  console.log('Creating indexes...');
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "sub_space_requests_sub_space_id_idx" ON "sub_space_requests"("sub_space_id");`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "sub_space_requests_target_space_id_idx" ON "sub_space_requests"("target_space_id");`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "sub_space_requests_requested_by_idx" ON "sub_space_requests"("requested_by");`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "sub_space_requests_status_idx" ON "sub_space_requests"("status");`,
  );

  console.log('Done. sub_space_requests table is ready.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
