/*
  Warnings:

  - Added the required column `deliveryAddress` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryName` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryPhone` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "deliveryAddress" TEXT NOT NULL,
ADD COLUMN     "deliveryName" TEXT NOT NULL,
ADD COLUMN     "deliveryPhone" TEXT NOT NULL;
