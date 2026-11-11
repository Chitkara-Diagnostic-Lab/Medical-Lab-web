export class BookingError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'BookingError'
  }
}

export class TestNotFoundError extends BookingError {
  constructor() {
    super('Test not found or inactive', 'TEST_NOT_FOUND', 404)
  }
}

export class SlotNotFoundError extends BookingError {
  constructor() {
    super('Invalid slot for test', 'SLOT_NOT_FOUND', 404)
  }
}

export class SlotInactiveError extends BookingError {
  constructor() {
    super('This time slot is no longer available', 'SLOT_INACTIVE', 400)
  }
}

export class SlotFullError extends BookingError {
  constructor() {
    super('Slot is fully booked. Choose another slot', 'SLOT_FULL', 409)
  }
}

export class PastSlotError extends BookingError {
  constructor() {
    super('Cannot book past time slots', 'PAST_SLOT', 400)
  }
}

export class DuplicateBookingError extends BookingError {
  constructor() {
    super('You already have a booking for this time slot', 'DUPLICATE_BOOKING', 409)
  }
}
export class BookingNotFoundError extends BookingError {
  constructor(message = 'Booking not found') {
    super(message, 'BOOKING_NOT_FOUND', 404)
  }
}