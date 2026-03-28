-- CreateTable
CREATE TABLE "galleries" (
    "id" SERIAL NOT NULL,
    "weddingId" INTEGER NOT NULL,
    "imageUrl" VARCHAR(500) NOT NULL,
    "thumbnailUrl" VARCHAR(500),
    "caption" VARCHAR(255),
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "galleries_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
