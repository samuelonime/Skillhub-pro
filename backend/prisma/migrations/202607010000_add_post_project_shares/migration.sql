-- CreateTable post_shares
CREATE TABLE "post_shares" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "note" TEXT,
    "sharedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable project_shares
CREATE TABLE "project_shares" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "note" TEXT,
    "sharedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "post_shares_userId_postId_key" ON "post_shares"("userId", "postId");

-- CreateIndex
CREATE INDEX "post_shares_userId_idx" ON "post_shares"("userId");

-- CreateIndex
CREATE INDEX "post_shares_postId_idx" ON "post_shares"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "project_shares_userId_projectId_key" ON "project_shares"("userId", "projectId");

-- CreateIndex
CREATE INDEX "project_shares_userId_idx" ON "project_shares"("userId");

-- CreateIndex
CREATE INDEX "project_shares_projectId_idx" ON "project_shares"("projectId");

-- AddForeignKey
ALTER TABLE "post_shares" ADD CONSTRAINT "post_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_shares" ADD CONSTRAINT "post_shares_postId_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_shares" ADD CONSTRAINT "project_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_shares" ADD CONSTRAINT "project_shares_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
