/*
  Warnings:

  - You are about to drop the column `bookingId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `changes` on the `audit_log` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `audit_log` table. All the data in the column will be lost.
  - You are about to drop the column `bookingId` on the `report` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `report` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `report` table. All the data in the column will be lost.
  - You are about to drop the column `currentBooked` on the `timeslot` table. All the data in the column will be lost.
  - You are about to drop the column `maxBooked` on the `timeslot` table. All the data in the column will be lost.
  - You are about to drop the `booking` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[appointmentId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[appointmentId]` on the table `report` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[date,startTime]` on the table `timeslot` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `appointmentId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `actorType` to the `audit_log` table without a default value. This is not possible if the table is not empty.
  - Added the required column `appointmentId` to the `report` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('USER', 'SYSTEM');

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "audit_log" DROP CONSTRAINT "audit_log_userId_fkey";

-- DropForeignKey
ALTER TABLE "booking" DROP CONSTRAINT "booking_slotId_fkey";

-- DropForeignKey
ALTER TABLE "booking" DROP CONSTRAINT "booking_testId_fkey";

-- DropForeignKey
ALTER TABLE "booking" DROP CONSTRAINT "booking_userId_fkey";

-- DropForeignKey
ALTER TABLE "report" DROP CONSTRAINT "report_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "timeslot" DROP CONSTRAINT "timeslot_testId_fkey";

-- DropIndex
DROP INDEX "Payment_bookingId_key";

-- DropIndex
DROP INDEX "audit_log_entity_entityId_idx";

-- DropIndex
DROP INDEX "audit_log_userId_idx";

-- DropIndex
DROP INDEX "report_bookingId_isActive_idx";

-- DropIndex
DROP INDEX "timeslot_date_isActive_idx";

-- DropIndex
DROP INDEX "timeslot_testId_date_startTime_key";

-- DropIndex
DROP INDEX "timeslot_testId_idx";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "bookingId",
ADD COLUMN     "appointmentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "audit_log" DROP COLUMN "changes",
DROP COLUMN "userId",
ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "actorType" "ActorType" NOT NULL,
ADD COLUMN     "reason" TEXT;

-- AlterTable
ALTER TABLE "report" DROP COLUMN "bookingId",
DROP COLUMN "isActive",
DROP COLUMN "version",
ADD COLUMN     "appointmentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "timeslot" DROP COLUMN "currentBooked",
DROP COLUMN "maxBooked",
ADD COLUMN     "currentPatients" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxPatients" INTEGER NOT NULL DEFAULT 2,
ALTER COLUMN "testId" DROP NOT NULL;

-- DropTable
DROP TABLE "booking";

-- CreateTable
CREATE TABLE "appointment" (
    "id" TEXT NOT NULL,
    "appointmentNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_item" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "appointment_appointmentNumber_key" ON "appointment"("appointmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_userId_slotId_status_key" ON "appointment"("userId", "slotId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_item_appointmentId_testId_key" ON "appointment_item"("appointmentId", "testId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_appointmentId_key" ON "Payment"("appointmentId");

-- CreateIndex
CREATE INDEX "audit_log_actorId_idx" ON "audit_log"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "report_appointmentId_key" ON "report"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "timeslot_date_startTime_key" ON "timeslot"("date", "startTime");

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "timeslot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_item" ADD CONSTRAINT "appointment_item_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_item" ADD CONSTRAINT "appointment_item_testId_fkey" FOREIGN KEY ("testId") REFERENCES "test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeslot" ADD CONSTRAINT "timeslot_testId_fkey" FOREIGN KEY ("testId") REFERENCES "test"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
