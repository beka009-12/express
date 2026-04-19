/*
  Warnings:

  - You are about to drop the column `color` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "color",
DROP COLUMN "size",
ADD COLUMN     "colors" TEXT[],
ADD COLUMN     "sizes" TEXT[];
