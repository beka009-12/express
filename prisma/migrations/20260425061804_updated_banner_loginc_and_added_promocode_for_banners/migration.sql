/*
  Warnings:

  - You are about to drop the column `type` on the `banner_slots` table. All the data in the column will be lost.
  - Made the column `price` on table `banner_slots` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "banner_slots_type_idx";

-- AlterTable
ALTER TABLE "banner_slots" DROP COLUMN "type",
ALTER COLUMN "startAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "price" SET DEFAULT 500.00;

-- AlterTable
ALTER TABLE "banners" ADD COLUMN     "rejectReason" TEXT;

-- DropEnum
DROP TYPE "SlotType";

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "discount" INTEGER NOT NULL,
    "usageLimit" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");
