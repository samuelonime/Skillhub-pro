-- SkillHub Pro: support enrollments in courses that live in another
-- database (Digital Skills / Meritlives) without duplicating course rows.
--
-- HOW TO RUN (pick one):
--   1) npx prisma db execute --file prisma/manual_migrations/2026_06_17_enrollment_source.sql --schema prisma/schema.prisma
--   2) psql "$DATABASE_URL" -f prisma/manual_migrations/2026_06_17_enrollment_source.sql
--
-- After running this, also run `npx prisma generate` so the Prisma Client
-- types match the updated schema.prisma (course relation removed,
-- source/category/title columns added).

BEGIN;

-- 1. Drop the FK from enrollments -> courses. courseId may now hold an ID
--    from Digital Skills' database, which the local courses table cannot
--    validate against.
ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "enrollments_courseId_fkey";

-- 2. Add the new columns.
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "source"   TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "title"    TEXT;

-- 3. Backfill category/title for existing local enrollments so the skill
--    decay analytics keep working without a join after this migration.
UPDATE "enrollments" e
SET "category" = c."category",
    "title"    = c."title"
FROM "courses" c
WHERE e."courseId" = c."id"
  AND e."category" IS NULL;

-- 4. Replace the old (userId, courseId) unique constraint with one that
--    also includes source, so the same external ID could theoretically
--    never collide with an unrelated local UUID.
ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "enrollments_userId_courseId_key";
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_userId_courseId_source_key"
    UNIQUE ("userId", "courseId", "source");

-- 5. Helpful index for "all enrollments for this course" lookups
--    (e.g. counting Digital Skills enrollments) without the FK.
CREATE INDEX IF NOT EXISTS "enrollments_courseId_source_idx"
    ON "enrollments" ("courseId", "source");

COMMIT;