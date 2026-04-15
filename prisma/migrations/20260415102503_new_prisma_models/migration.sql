/*
  Warnings:

  - You are about to drop the column `tags` on the `products` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sku]` on the table `products` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('PICKUP', 'COURIER_BISHKEK', 'COURIER_REGION', 'EXPRESS');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'UNISEX');

-- CreateEnum
CREATE TYPE "Season" AS ENUM ('SPRING_SUMMER', 'AUTUMN_WINTER', 'ALL_SEASON');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PROCESSING';

-- DropIndex
DROP INDEX "products_brandName_idx";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "addressId" INTEGER,
ADD COLUMN     "deliveryCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "deliveryMethod" "DeliveryMethod" NOT NULL DEFAULT 'COURIER_BISHKEK',
ADD COLUMN     "trackingNumber" TEXT;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "tags",
ADD COLUMN     "color" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "material" TEXT,
ADD COLUMN     "season" "Season",
ADD COLUMN     "size" TEXT,
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "soldCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "storeId" INTEGER,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "images" TEXT[],
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Бишкек',
    "region" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reviews_productId_idx" ON "reviews"("productId");

-- CreateIndex
CREATE INDEX "reviews_storeId_idx" ON "reviews"("storeId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_isActive_idx" ON "products"("isActive");

-- CreateIndex
CREATE INDEX "products_soldCount_idx" ON "products"("soldCount");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
