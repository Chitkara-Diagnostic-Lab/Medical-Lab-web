import { describe, expect, it } from "vitest";
import * as BookingErrors from "./booking.errors";
import {
  BookingError,
  NoTestsSelectedError,
  DuplicateTestError,
  TestNotFoundError,
  SlotNotFoundError,
  SlotFullError,
  PastSlotError,
  DuplicateBookingError,
  BookingNotFoundError,
  InvalidAmountError,
} from "./booking.errors";

describe("BookingError", () => {
  it("sets message, code, statusCode and name", () => {
    const err = new BookingError("Something went wrong", "SOME_CODE", 422);

    expect(err.message).toBe("Something went wrong");
    expect(err.code).toBe("SOME_CODE");
    expect(err.statusCode).toBe(422);
    expect(err.name).toBe("BookingError");
    expect(err).toBeInstanceOf(Error);
  });

  it("defaults statusCode to 400 when not provided", () => {
    const err = new BookingError("Default status", "DEFAULT_CODE");
    expect(err.statusCode).toBe(400);
  });
});

describe("NoTestsSelectedError (new)", () => {
  it("has the expected message, code and statusCode", () => {
    const err = new NoTestsSelectedError();

    expect(err.message).toBe("Select at least one test to book");
    expect(err.code).toBe("NO_TESTS_SELECTED");
    expect(err.statusCode).toBe(400);
    expect(err).toBeInstanceOf(BookingError);
  });
});

describe("DuplicateTestError (new)", () => {
  it("has the expected message, code and statusCode", () => {
    const err = new DuplicateTestError();

    expect(err.message).toBe("Duplicate tests are not allowed");
    expect(err.code).toBe("DUPLICATE_TESTS");
    expect(err.statusCode).toBe(400);
    expect(err).toBeInstanceOf(BookingError);
  });
});

describe("TestNotFoundError (message updated)", () => {
  it("uses the updated message while keeping the same code and statusCode", () => {
    const err = new TestNotFoundError();

    expect(err.message).toBe("One or more tests are inactive or invalid");
    expect(err.code).toBe("TEST_NOT_FOUND");
    expect(err.statusCode).toBe(404);
  });
});

describe("SlotNotFoundError (message updated, replaces SlotInactiveError)", () => {
  it("uses the updated message that now also covers inactive slots", () => {
    const err = new SlotNotFoundError();

    expect(err.message).toBe("Time slot not found or inactive");
    expect(err.code).toBe("SLOT_NOT_FOUND");
    expect(err.statusCode).toBe(404);
  });

  it("no longer exports a separate SlotInactiveError", () => {
    expect(BookingErrors).not.toHaveProperty("SlotInactiveError");
  });
});

describe("InvalidAmountError (new)", () => {
  it("has the expected message, code and statusCode", () => {
    const err = new InvalidAmountError();

    expect(err.message).toBe("Calculated total amount is invalid");
    expect(err.code).toBe("INVALID_AMOUNT");
    expect(err.statusCode).toBe(400);
    expect(err).toBeInstanceOf(BookingError);
  });
});

describe("Unchanged booking error classes", () => {
  it("SlotFullError keeps its original shape", () => {
    const err = new SlotFullError();
    expect(err.message).toBe("Slot is fully booked. Choose another slot");
    expect(err.code).toBe("SLOT_FULL");
    expect(err.statusCode).toBe(409);
  });

  it("PastSlotError keeps its original shape", () => {
    const err = new PastSlotError();
    expect(err.message).toBe("Cannot book past time slots");
    expect(err.code).toBe("PAST_SLOT");
    expect(err.statusCode).toBe(400);
  });

  it("DuplicateBookingError keeps its original shape", () => {
    const err = new DuplicateBookingError();
    expect(err.message).toBe("You already have a booking for this time slot");
    expect(err.code).toBe("DUPLICATE_BOOKING");
    expect(err.statusCode).toBe(409);
  });

  it("BookingNotFoundError supports a custom message and default", () => {
    const defaultErr = new BookingNotFoundError();
    expect(defaultErr.message).toBe("Booking not found");
    expect(defaultErr.code).toBe("BOOKING_NOT_FOUND");
    expect(defaultErr.statusCode).toBe(404);

    const customErr = new BookingNotFoundError("Custom not found message");
    expect(customErr.message).toBe("Custom not found message");
  });
});

describe("Error class hierarchy", () => {
  it.each([
    NoTestsSelectedError,
    DuplicateTestError,
    TestNotFoundError,
    SlotNotFoundError,
    SlotFullError,
    PastSlotError,
    DuplicateBookingError,
    BookingNotFoundError,
    InvalidAmountError,
  ])("%p instances are both BookingError and Error", (ErrorClass) => {
    const err = new ErrorClass();
    expect(err).toBeInstanceOf(BookingError);
    expect(err).toBeInstanceOf(Error);
  });
});