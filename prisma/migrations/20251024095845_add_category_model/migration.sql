/*
  Warnings:

  - A unique constraint covering the columns `[name,parentId]` on the table `Category` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Category_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_parentId_key" ON "public"."Category"("name", "parentId");
