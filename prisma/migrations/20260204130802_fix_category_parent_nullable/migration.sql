-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "orders"("userId");

-- CreateIndex
CREATE INDEX "products_brandName_idx" ON "products"("brandName");

-- CreateIndex
CREATE INDEX "stores_ownerId_idx" ON "stores"("ownerId");
