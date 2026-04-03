-- CreateTable
CREATE TABLE "guestbooks" (
    "id" SERIAL NOT NULL,
    "weddingId" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "content" VARCHAR(200) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guestbooks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "guestbooks" ADD CONSTRAINT "guestbooks_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
