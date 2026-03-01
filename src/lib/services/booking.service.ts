import prisma from '@/lib/prisma'
import {
  BookingError,
  TestNotFoundError,
  SlotNotFoundError,
  SlotInactiveError,
  SlotFullError,
  PastSlotError,
  DuplicateBookingError,
} from '@/lib/errors/booking.errors'
import { isSlotInFuture } from '@/lib/utils/date'

export interface CreateBookingData {
  userId: string
  testId: string
  slotId: string
}

export async function createBooking(data: CreateBookingData) {
  try {
    const { userId, testId, slotId } = data

    return await prisma.$transaction(async (tx) => {
      const test = await tx.test.findFirst({
        where: {
          id: testId,
          isActive: true,
        },
      })

      if (!test) {
        throw new TestNotFoundError()
      }

      const slot = await tx.timeslot.findUnique({
        where: { id: slotId },
        select: {
          testId: true,
          date: true,
          startTime: true,
          currentBooked: true,
          maxBooked: true,
          isActive: true,
        },
      })

      if (!slot || slot.testId !== testId) {
        throw new SlotNotFoundError()
      }

      if (!slot.isActive) {
        throw new SlotInactiveError()
      }

      //Check capacity
      if (slot.currentBooked >= slot.maxBooked) {
        throw new SlotFullError()
      }

      // 4. Check if slot is in future
      if (!isSlotInFuture(slot.date, slot.startTime)) {
        throw new PastSlotError()
      }

      //Check for duplicate booking
      const existingBooking = await tx.booking.findFirst({
        where: {
          userId,
          slotId,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        select: { id: true },
      })

      if (existingBooking) {
        throw new DuplicateBookingError()
      }

      const updateResult = await tx.timeslot.updateMany({
        where: {
          id: slotId,
          currentBooked: { lt: slot.maxBooked },
          isActive: true,
        },
        data: {
          currentBooked: { increment: 1 },
        },
      })

      if (updateResult.count === 0) {
        throw new SlotFullError()
      }

      const booking = await tx.booking.create({
        data: {
          userId,
          testId,
          slotId,
          amount: test.price,
          status: 'PENDING',
        },
        select: {
          id: true,
          bookingNumber: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      })

      return booking
    })
  } catch (error) {
    if (error instanceof BookingError) {
      throw error
    }
    throw new BookingError(
      'Failed to create booking',
      'BOOKING_CREATE_FAILED',
      500
    )
  }
}