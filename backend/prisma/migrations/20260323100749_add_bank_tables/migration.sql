-- CreateTable
CREATE TABLE "banks" (
    "id" SERIAL NOT NULL,
    "bankCode" VARCHAR(10) NOT NULL,
    "bankName" VARCHAR(50) NOT NULL,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_prefixes" (
    "id" SERIAL NOT NULL,
    "bankId" INTEGER NOT NULL,
    "prefix" VARCHAR(10) NOT NULL,

    CONSTRAINT "bank_prefixes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "banks_bankCode_key" ON "banks"("bankCode");

-- CreateIndex
CREATE INDEX "bank_prefixes_bankId_idx" ON "bank_prefixes"("bankId");

-- CreateIndex
CREATE INDEX "bank_prefixes_prefix_idx" ON "bank_prefixes"("prefix");

-- AddForeignKey
ALTER TABLE "bank_prefixes" ADD CONSTRAINT "bank_prefixes_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
