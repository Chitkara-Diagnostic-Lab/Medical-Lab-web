'use server'

import { requireAuth } from '@/lib/server-auth'
import { redirect } from 'next/navigation'
import { createBookingSchema } from '@/lib/validation/booking'
import { createBooking } from '@/lib/services/booking.service'

type BookingResult = { error: string } | void

export async function createBookingAction(
  testId: string,
  slotId: string
): Promise<BookingResult> {
  
  const validatedData = createBookingSchema.safeParse({ testId, slotId })
  if (!validatedData.success) {
    return { error: 'Invalid test or slot ID' }
  }
  
  const session = await requireAuth()
  const userId = session.user.id
  
  if (session.user.role !== 'USER') {
    return { error: 'Only patients can create bookings' }
  }
  
  try {
    const booking = await createBooking({
      userId,
      testId,
      slotId,
    })
 
    redirect(`/payment/${booking.id}`)
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error
    }
    
    console.error('Booking creation error:', error)
    return {
      error: error instanceof Error 
        ? error.message 
        : 'Failed to create booking. Please try again.'
    }
  }
}