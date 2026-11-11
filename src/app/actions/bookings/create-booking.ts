'use server'

import { requireAuth } from '@/lib/server-auth'
import { redirect } from 'next/navigation'
import { createBookingSchema } from '@/lib/validation/booking'
import { createAppointment } from '@/lib/services/booking_service'

type BookingResult = { error: string } | void

export async function createBookingAction(
  testIds: string[],
  slotId: string
): Promise<BookingResult> {

  const validatedData = createBookingSchema.safeParse({ testIds, slotId })
  if (!validatedData.success) {
    return { error: 'Invalid test or slot ID' }
  }

  const session = await requireAuth()
  const userId = session.user.id

  if (session.user.role !== 'USER') {
    return { error: 'Only patients can create bookings' }
  }
  let appointment;
  try {
    appointment = await createAppointment({
      userId,
      tests: testIds,
      slotId,
    })

  } catch (error) {
    console.error('Booking creation error:', error)
    return {
      error: error instanceof Error
        ? error.message
        : 'Failed to create booking. Please try again.'
    }
  }
  redirect(`/payment/${appointment.id}`)
}