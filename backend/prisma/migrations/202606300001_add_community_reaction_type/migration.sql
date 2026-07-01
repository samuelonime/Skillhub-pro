ALTER TABLE "community_likes"
ADD COLUMN IF NOT EXISTS "reactionType" TEXT;

UPDATE "community_likes"
SET "reactionType" = '👍'
WHERE "postId" IS NOT NULL
  AND "reactionType" IS NULL;