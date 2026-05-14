/*
  Warnings:

  - You are about to drop the column `productId` on the `banners` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "banners" DROP CONSTRAINT "banners_productId_fkey";

-- AlterTable
ALTER TABLE "banners" DROP COLUMN "productId",
ALTER COLUMN "color" SET DEFAULT '#ef4444';

-- AlterTable
ALTER TABLE "favorites" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
