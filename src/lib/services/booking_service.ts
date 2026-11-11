import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../prisma";
import { isSlotInFuture } from "../utils/date";

export interface CreateAppointmentInput {
    userId: string,
    slotId: string,
    tests: string[],
}

export async function createAppointment(data: CreateAppointmentInput) {
    try {
        const { userId, slotId, tests } = data;
        if (!tests.length) {
            throw new Error("No tests selected")
        }
        const testduplicate = tests.filter((test, index) => tests.indexOf(test) !== index).length > 0;
        if (testduplicate) {
            throw new Error("Duplicate tests selected")
        }
        const createappointment = await prisma.$transaction(async (tx) => {
            //validate test
            const test = await tx.test.findMany({
                where: {
                    id: {
                        in: tests
                    },
                    isActive: true
                }
            });
            if (test.length !== tests.length) {
                throw new Error("Some tests are inactive or invalid")
            }
            //validaate slot
            const slot = await tx.timeslot.findUnique({
                where: {
                    id: slotId,
                },
            })
            if (!slot || !slot.isActive) {
                throw new Error("Slot is not active or invalid")
            }
            if (!isSlotInFuture(slot.date, slot.startTime)) {
                throw new Error("Slot is in the past")
            }
            const checkslot = await tx.timeslot.updateMany({
                where: {
                    id: slotId,
                    currentPatients: { lt: slot.maxPatients },
                    isActive: true
                },
                data: {
                    currentPatients: { increment: 1 },
                }
            })
            if (checkslot.count === 0) {
                throw new Error("Slot is full")
            }
            //calculate the total
            const totalAmount = test.reduce((sum, test) => sum + test.price, 0)

            const appointmentresult = await tx.appointment.create({
                data: {
                    userId,
                    slotId,
                    status: "PENDING",
                    totalAmount: totalAmount,
                    items: {
                        create: test.map((t) => ({
                            testId: t.id,
                            price: t.price,
                        }))
                    }
                },
                include: {
                    items: { include: { test: true } },
                    slot: true
                }
            })
            return appointmentresult;
        })
        return createappointment;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new Error("You already have an active booking for this slot")
        }
        throw error;
    }
}