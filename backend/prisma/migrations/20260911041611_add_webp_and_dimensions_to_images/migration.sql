-- AlterTable
ALTER TABLE "galleries" ADD COLUMN     "displayWebpUrl" VARCHAR(500),
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "thumbnailWebpUrl" VARCHAR(500),
ADD COLUMN     "width" INTEGER;

-- AlterTable
ALTER TABLE "hero_images" ADD COLUMN     "height" INTEGER,
ADD COLUMN     "webpUrl" VARCHAR(500),
ADD COLUMN     "width" INTEGER;
