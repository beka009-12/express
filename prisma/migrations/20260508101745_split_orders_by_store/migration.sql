-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_orderId_fkey";

-- DropIndex
DROP INDEX "payments_orderId_key";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "paymentId" INTEGER;

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "orderId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
