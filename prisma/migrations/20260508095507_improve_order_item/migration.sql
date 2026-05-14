/*
  Warnings:

  - You are about to drop the column `price` on the `order_items` table. All the data in the column will be lost.
  - Added the required column `priceAtBuy` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "price",
ADD COLUMN     "newPriceAtBuy" DECIMAL(10,2),
ADD COLUMN     "priceAtBuy" DECIMAL(10,2) NOT NULL;

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");
