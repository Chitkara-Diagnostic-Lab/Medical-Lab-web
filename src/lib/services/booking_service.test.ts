import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../prisma";
import { createAppointment } from "./booking_service";
import {
    DuplicateTestError,
    NoTestsSelectedError,
    SlotNotFoundError,
    TestNotFoundError,
    SlotFullError,
    PastSlotError,
    DuplicateBookingError,
    InvalidAmountError,
} from "../errors/booking.errors";

describe("createAppointment", () => {
    let userId: string;
    let testId: string;
    let slotId: string;

    beforeAll(async () => {
        const uniqueId = Date.now();

        const user = await prisma.user.create({
            data: {
                name: `Test User ${uniqueId}`,
                email: `test-${uniqueId}@example.com`,
            },
        });

        const test = await prisma.test.create({
            data: {
                name: `Blood Test ${uniqueId}`,
                description: "Integration test",
                price: 500,
                duration: 30,
                category: "PATHOLOGY",
                isActive: true,
            },
        });

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 7);
        tomorrow.setHours(0, 0, 0, 0);

        const slot = await prisma.timeslot.create({
            data: {
                date: tomorrow,
                startTime: "02:00",
                endTime: "02:30",
                currentPatients: 0,
                maxPatients: 5,
                isActive: true,
            },
        });

        userId = user.id;
        testId = test.id;
        slotId = slot.id;
    });
    it("should reject a booking with an invalid test amount", async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 6);
        tomorrow.setHours(0, 0, 0, 0);

        const freeSlot = await prisma.timeslot.create({
            data: {
                date: tomorrow,
                startTime: "02:00",
                endTime: "02:30",
                currentPatients: 0,
                maxPatients: 5,
                isActive: true,
            },
        });

        const freeTest = await prisma.test.create({
            data: {
                name: `Free Test ${Date.now()}`,
                description: "Invalid amount test",
                price: 0,
                duration: 30,
                category: "PATHOLOGY",
                isActive: true,
            },
        });

        await expect(
            createAppointment({
                userId,
                slotId: freeSlot.id,
                tests: [freeTest.id],
            })
        ).rejects.toThrow(InvalidAmountError);

        const slot = await prisma.timeslot.findUnique({
            where: {
                id: freeSlot.id,
            },
        });

        expect(slot?.currentPatients).toBe(0);

        const appointments = await prisma.appointment.count({
            where: {
                slotId: freeSlot.id,
            },
        });

        expect(appointments).toBe(0);
    });
});