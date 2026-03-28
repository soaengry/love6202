-- CreateTable
CREATE TABLE "uploads" (
    "id" SERIAL NOT NULL,
    "weddingId" INTEGER NOT NULL,
    "sessionId" VARCHAR(36) NOT NULL,
    "userId" INTEGER,
    "driveFileId" VARCHAR(255) NOT NULL,
    "imageUrl" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "uploads_weddingId_idx" ON "uploads"("weddingId");

-- CreateIndex
CREATE INDEX "uploads_sessionId_idx" ON "uploads"("sessionId");

-- CreateIndex
CREATE INDEX "uploads_userId_idx" ON "uploads"("userId");

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
