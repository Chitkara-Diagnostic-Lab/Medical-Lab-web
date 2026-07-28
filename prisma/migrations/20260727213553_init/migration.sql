/*
  Warnings:

  - A unique constraint covering the columns `[userId,slotId]` on the table `appointment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "appointment_userId_slotId_status_key";

-- CreateIndex
CREATE UNIQUE INDEX "unique_active_appointment_per_slot"
ON "appointment" ("userId", "slotId")
WHERE "status" IN ('PENDING', 'CONFIRMED');
