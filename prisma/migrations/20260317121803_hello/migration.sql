/*
  Warnings:

  - You are about to drop the column `oldPrice` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "oldPrice",
ADD COLUMN     "newPrice" DECIMAL(10,2);
