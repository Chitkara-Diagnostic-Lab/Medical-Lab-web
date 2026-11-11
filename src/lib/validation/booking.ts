import { z } from 'zod'

export const createBookingSchema = z.object({
  testIds: z.array(z.string().cuid('Invalid test ID'))
    .min(1, 'Select at least one test')
    .max(10, 'Cannot book more than 10 tests at once'),
  slotId: z.string().cuid('Invalid slot ID'),
})

export const cancelBookingSchema = z.object({
  appointmentId: z.string().cuid('Invalid appointment ID'),
  reason: z.string().optional(),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>