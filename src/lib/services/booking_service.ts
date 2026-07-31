import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../prisma";
import { isSlotInFuture } from "../utils/date";
import {
    NoTestsSelectedError,
    DuplicateTestError,
    TestNotFoundError,
    SlotNotFoundError,
    SlotFullError,
    PastSlotError,
    DuplicateBookingError,
    InvalidAmountError,
} from "../errors/booking.errors";

export interface CreateAppointmentInput {
    userId: string;
    slotId: string;
    tests: string[];
}

export async function createAppointment(data: CreateAppointmentInput) {
    const { userId, slotId, tests } = data;

    if (!tests.length) {
        throw new NoTestsSelectedError();
    }

    const hasDuplicates = new Set(tests).size !== tests.length;
    if (hasDuplicates) {
        throw new DuplicateTestError();
    }

    try {
        const appointment = await prisma.$transaction(async (tx) => {
            // Validate tests exist and are active
            const validTests = await tx.test.findMany({
                where: {
                    id: { in: tests },
                    isActive: true,
                },
            });

            if (validTests.length !== tests.length) {
                throw new TestNotFoundError();
            }

            // Validate slot exists and is active
            const slot = await tx.timeslot.findUnique({
                where: { id: slotId },
            });

            if (!slot || !slot.isActive) {
                throw new SlotNotFoundError();
            }

            if (!isSlotInFuture(slot.date, slot.startTime)) {
                throw new PastSlotError();
            }

            // Atomically reserve the slot (optimistic concurrency)
            const reserved = await tx.timeslot.updateMany({
                where: {
                    id: slotId,
                    currentPatients: { lt: slot.maxPatients },
                    isActive: true,
                },
                data: {
                    currentPatients: { increment: 1 },
                },
            });

            if (reserved.count === 0) {
                throw new SlotFullError();
            }

            const totalAmount = validTests.reduce(
                (sum, t) => sum.add(t.price),
                new Prisma.Decimal(0)
            );

            if (totalAmount.lte(0)) {
                throw new InvalidAmountError();
            }

            // Create appointment with items
            return tx.appointment.create({
                data: {
                    userId,
                    slotId,
                    status: "PENDING",
                    totalAmount,
                    items: {
                        create: validTests.map((t) => ({
                            testId: t.id,
                            price: t.price,
                        })),
                    },
                },
                include: {
                    items: { include: { test: true } },
                    slot: true,
                },
            });
        });

        return appointment;
    } catch (error) {
        // Re-throw our custom errors as-is
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new DuplicateBookingError();
        }
        throw error;
    }
}