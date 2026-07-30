-- AlterTable
ALTER TABLE "courses" ADD COLUMN "url" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "courses_title_provider_key" ON "courses"("title", "provider");