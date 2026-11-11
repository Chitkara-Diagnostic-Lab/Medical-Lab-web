/*
  Warnings:

  - You are about to drop the column `testId` on the `timeslot` table. All the data in the column will be lost.
  - You are about to drop the column `PhoneNumber` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userId_fkey";

-- DropForeignKey
ALTER TABLE "timeslot" DROP CONSTRAINT "timeslot_testId_fkey";

-- AlterTable
ALTER TABLE "timeslot" DROP COLUMN "testId";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "PhoneNumber",
ADD COLUMN     "phone_number" TEXT;

-- DropTable
DROP TABLE "Payment";

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "provider" TEXT NOT NULL,
    "providerTxnId" TEXT,
    "providerPaymentId" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "webhookVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_appointmentId_key" ON "payment"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_providerTxnId_key" ON "payment"("providerTxnId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_providerPaymentId_key" ON "payment"("providerPaymentId");

-- CreateIndex
CREATE INDEX "payment_providerTxnId_idx" ON "payment"("providerTxnId");

-- CreateIndex
CREATE INDEX "payment_isPaid_idx" ON "payment"("isPaid");

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
