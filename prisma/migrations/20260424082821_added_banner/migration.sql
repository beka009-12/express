-- CreateEnum
CREATE TYPE "PromoType" AS ENUM ('PERCENT', 'FIXED_PRICE', 'BUY_ONE_GET', 'SEASONAL');

-- CreateEnum
CREATE TYPE "SlotType" AS ENUM ('FREE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "BannerStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "banners" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "accent" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "decoNum" TEXT NOT NULL,
    "promoTag" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'red',
    "promoType" "PromoType" NOT NULL,
    "discount" INTEGER,
    "fixedPrice" DECIMAL(10,2),
    "deadline" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" "BannerStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" INTEGER,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banner_slots" (
    "id" SERIAL NOT NULL,
    "bannerId" INTEGER NOT NULL,
    "type" "SlotType" NOT NULL DEFAULT 'FREE',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(10,2),
    "isPaid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "banner_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banner_products" (
    "id" SERIAL NOT NULL,
    "bannerId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "originalPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "banner_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "banners_isActive_idx" ON "banners"("isActive");

-- CreateIndex
CREATE INDEX "banners_status_idx" ON "banners"("status");

-- CreateIndex
CREATE INDEX "banners_deadline_idx" ON "banners"("deadline");

-- CreateIndex
CREATE UNIQUE INDEX "banner_slots_bannerId_key" ON "banner_slots"("bannerId");

-- CreateIndex
CREATE INDEX "banner_slots_type_idx" ON "banner_slots"("type");

-- CreateIndex
CREATE INDEX "banner_slots_endAt_idx" ON "banner_slots"("endAt");

-- CreateIndex
CREATE UNIQUE INDEX "banner_products_bannerId_productId_key" ON "banner_products"("bannerId", "productId");

-- CreateIndex
CREATE INDEX "products_storeId_idx" ON "products"("storeId");

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banner_slots" ADD CONSTRAINT "banner_slots_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "banners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banner_products" ADD CONSTRAINT "banner_products_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "banners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banner_products" ADD CONSTRAINT "banner_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
