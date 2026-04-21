-- AlterTable
ALTER TABLE "uploads" ADD COLUMN     "driveSyncedAt" TIMESTAMPTZ,
ADD COLUMN     "s3Key" VARCHAR(500),
ALTER COLUMN "driveFileId" DROP NOT NULL;
