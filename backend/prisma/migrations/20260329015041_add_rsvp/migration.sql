-- CreateTable
CREATE TABLE "rsvps" (
    "id" SERIAL NOT NULL,
    "weddingId" INTEGER NOT NULL,
    "sessionId" VARCHAR(100) NOT NULL,
    "userId" INTEGER,
    "attendance" VARCHAR(10) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "side" VARCHAR(20) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "attendeeCount" INTEGER NOT NULL DEFAULT 1,
    "willEat" BOOLEAN NOT NULL DEFAULT false,
    "mealCount" INTEGER NOT NULL DEFAULT 0,
    "willRide" BOOLEAN NOT NULL DEFAULT false,
    "rideCount" INTEGER NOT NULL DEFAULT 0,
    "note" VARCHAR(50),
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "rsvps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rsvps_weddingId_idx" ON "rsvps"("weddingId");

-- CreateIndex
CREATE INDEX "rsvps_sessionId_idx" ON "rsvps"("sessionId");

-- AddForeignKey
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
