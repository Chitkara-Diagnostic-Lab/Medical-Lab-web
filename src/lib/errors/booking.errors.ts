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

// ── Test Errors ──

export class NoTestsSelectedError extends BookingError {
  constructor() {
    super('Select at least one test to book', 'NO_TESTS_SELECTED', 400)
  }
}

export class DuplicateTestError extends BookingError {
  constructor() {
    super('Duplicate tests are not allowed', 'DUPLICATE_TESTS', 400)
  }
}

export class TestNotFoundError extends BookingError {
  constructor() {
    super('One or more tests are inactive or invalid', 'TEST_NOT_FOUND', 404)
  }
}

// ── Slot Errors ──

export class SlotNotFoundError extends BookingError {
  constructor() {
    super('Time slot not found or inactive', 'SLOT_NOT_FOUND', 404)
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

// ── Booking Errors ──

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

export class InvalidAmountError extends BookingError {
  constructor() {
    super('Calculated total amount is invalid', 'INVALID_AMOUNT', 400)
  }
}