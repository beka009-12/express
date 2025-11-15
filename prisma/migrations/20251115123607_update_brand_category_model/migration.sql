-- DropIndex
DROP INDEX "public"."Brand_name_key";

-- AlterTable
ALTER TABLE "public"."Category" ADD COLUMN     "topLevelId" INTEGER;

-- CreateTable
CREATE TABLE "public"."_BrandCategories" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_BrandCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_BrandCategories_B_index" ON "public"."_BrandCategories"("B");

-- AddForeignKey
ALTER TABLE "public"."Category" ADD CONSTRAINT "Category_topLevelId_fkey" FOREIGN KEY ("topLevelId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BrandCategories" ADD CONSTRAINT "_BrandCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BrandCategories" ADD CONSTRAINT "_BrandCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
