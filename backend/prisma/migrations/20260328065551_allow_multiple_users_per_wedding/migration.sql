-- DropIndex
DROP INDEX "users_weddingId_key";

-- CreateIndex
CREATE INDEX "users_weddingId_idx" ON "users"("weddingId");
