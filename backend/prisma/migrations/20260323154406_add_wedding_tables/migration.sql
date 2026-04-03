/*
  Warnings:

  - A unique constraint covering the columns `[bankId,prefix]` on the table `bank_prefixes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[weddingId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CoupleRole" AS ENUM ('GROOM', 'BRIDE');

-- CreateEnum
CREATE TYPE "AccountSide" AS ENUM ('GROOM', 'GROOM_FAMILY', 'BRIDE', 'BRIDE_FAMILY');

-- CreateEnum
CREATE TYPE "TransportationType" AS ENUM ('SUBWAY', 'BUS', 'SHUTTLE');

-- DropIndex
DROP INDEX "bank_prefixes_bankId_idx";

-- DropIndex
DROP INDEX "bank_prefixes_prefix_idx";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "weddingId" INTEGER;

-- CreateTable
CREATE TABLE "weddings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "weddingDate" TIMESTAMPTZ NOT NULL,
    "venueName" VARCHAR(255) NOT NULL,
    "venueAddress" VARCHAR(500) NOT NULL,
    "venueDetail" VARCHAR(500),
    "venueLat" DOUBLE PRECISION,
    "venueLng" DOUBLE PRECISION,
    "dressCode" VARCHAR(255),
    "notice" TEXT,
    "parkingInfo" TEXT,
    "mealInfo" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "weddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_images" (
    "id" SERIAL NOT NULL,
    "weddingId" INTEGER NOT NULL,
    "imageUrl" VARCHAR(500) NOT NULL,
    "thumbnailUrl" VARCHAR(500),
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hero_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "couples" (
    "id" SERIAL NOT NULL,
    "weddingId" INTEGER NOT NULL,
    "role" "CoupleRole" NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255),
    "contact" VARCHAR(50),
    "fatherName" VARCHAR(50),
    "isFatherAlive" BOOLEAN NOT NULL DEFAULT true,
    "motherName" VARCHAR(50),
    "isMotherAlive" BOOLEAN NOT NULL DEFAULT true,
    "profileImageUrl" VARCHAR(500),

    CONSTRAINT "couples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" SERIAL NOT NULL,
    "weddingId" INTEGER NOT NULL,
    "side" "AccountSide" NOT NULL,
    "bankName" VARCHAR(100) NOT NULL,
    "bankCode" VARCHAR(10) NOT NULL,
    "accountNumber" VARCHAR(50) NOT NULL,
    "accountHolder" VARCHAR(50) NOT NULL,
    "kakaoPayUrl" VARCHAR(500),
    "tossNumber" VARCHAR(50),
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" SERIAL NOT NULL,
    "weddingId" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transportations" (
    "id" SERIAL NOT NULL,
    "weddingId" INTEGER NOT NULL,
    "type" "TransportationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "transportations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" SERIAL NOT NULL,
    "weddingId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weddings_userId_key" ON "weddings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "couples_weddingId_role_key" ON "couples"("weddingId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "bank_prefixes_bankId_prefix_key" ON "bank_prefixes"("bankId", "prefix");

-- CreateIndex
CREATE UNIQUE INDEX "users_weddingId_key" ON "users"("weddingId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hero_images" ADD CONSTRAINT "hero_images_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "couples" ADD CONSTRAINT "couples_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transportations" ADD CONSTRAINT "transportations_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
