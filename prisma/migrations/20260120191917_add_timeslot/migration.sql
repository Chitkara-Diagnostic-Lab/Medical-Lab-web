/*
  Warnings:

  - You are about to drop the column `collectionDate` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `collectionTime` on the `Booking` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,slotId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slotId` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "collectionDate",
DROP COLUMN "collectionTime",
ADD COLUMN     "slotId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Timeslot" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timeslot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Timeslot_testId_startTime_idx" ON "Timeslot"("testId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_userId_slotId_key" ON "Booking"("userId", "slotId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Timeslot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timeslot" ADD CONSTRAINT "Timeslot_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
