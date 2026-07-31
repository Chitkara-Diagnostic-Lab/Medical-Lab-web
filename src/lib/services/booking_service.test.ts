import { beforeEach, describe, expect, it, vi } from "vitest";

// NOTE: vi.mock(...) factories are hoisted above regular declarations (and
// run before the mocked module is first imported anywhere in the module
// graph), so anything they reference must be created via vi.hoisted() or
// declared entirely inside the factory itself - a plain top-level `const`
// declared after the vi.mock call would still be in its temporal dead zone
// when the factory actually runs.

// Minimal Decimal stand-in mirroring the subset of the Prisma.Decimal API
// used by booking_service.ts (add, lte, toNumber), defined inside the
// factory so it never needs to be hoisted.
vi.mock("../../../generated/prisma/client", () => {
  class FakeDecimal {
    value: number;
    constructor(value: number | string | FakeDecimal) {
      this.value = value instanceof FakeDecimal ? value.value : Number(value);
    }
    add(other: number | FakeDecimal) {
      const otherValue =
        other instanceof FakeDecimal ? other.value : Number(other);
      return new FakeDecimal(this.value + otherValue);
    }
    lte(other: number | FakeDecimal) {
      const otherValue =
        other instanceof FakeDecimal ? other.value : Number(other);
      return this.value <= otherValue;
    }
    toNumber() {
      return this.value;
    }
  }

  class FakePrismaClientKnownRequestError extends Error {
    code: string;
    constructor(message: string, { code }: { code: string }) {
      super(message);
      this.name = "PrismaClientKnownRequestError";
      this.code = code;
    }
  }

  return {
    Prisma: {
      Decimal: FakeDecimal,
      PrismaClientKnownRequestError: FakePrismaClientKnownRequestError,
    },
  };
});

const mockPrisma = vi.hoisted(() => ({
  $transaction: vi.fn(),
  test: { findMany: vi.fn() },
  timeslot: { findUnique: vi.fn(), updateMany: vi.fn() },
  appointment: { create: vi.fn() },
}));

vi.mock("../prisma", () => ({
  prisma: mockPrisma,
}));

import { Prisma } from "../../../generated/prisma/client";
import { createAppointment } from "./booking_service";
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

type FakeDecimalInstance = { toNumber(): number };

function futureDate(daysFromNow = 5) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

function pastDate(daysAgo = 5) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

describe("createAppointment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: $transaction runs the callback with our mock "tx" (same object
    // as the top-level mockPrisma for simplicity).
    mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof mockPrisma) => unknown) =>
      cb(mockPrisma)
    );
  });

  it("throws NoTestsSelectedError when no tests are provided", async () => {
    await expect(
      createAppointment({ userId: "u1", slotId: "s1", tests: [] })
    ).rejects.toBeInstanceOf(NoTestsSelectedError);

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("throws DuplicateTestError when the tests array has duplicates", async () => {
    await expect(
      createAppointment({ userId: "u1", slotId: "s1", tests: ["t1", "t1"] })
    ).rejects.toBeInstanceOf(DuplicateTestError);

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("throws TestNotFoundError when some tests are invalid or inactive", async () => {
    mockPrisma.test.findMany.mockResolvedValue([{ id: "t1", price: 100 }]);

    await expect(
      createAppointment({ userId: "u1", slotId: "s1", tests: ["t1", "t2"] })
    ).rejects.toBeInstanceOf(TestNotFoundError);
  });

  it("throws SlotNotFoundError when the slot does not exist", async () => {
    mockPrisma.test.findMany.mockResolvedValue([{ id: "t1", price: 100 }]);
    mockPrisma.timeslot.findUnique.mockResolvedValue(null);

    await expect(
      createAppointment({ userId: "u1", slotId: "missing", tests: ["t1"] })
    ).rejects.toBeInstanceOf(SlotNotFoundError);
  });

  it("throws SlotNotFoundError when the slot is inactive", async () => {
    mockPrisma.test.findMany.mockResolvedValue([{ id: "t1", price: 100 }]);
    mockPrisma.timeslot.findUnique.mockResolvedValue({
      id: "s1",
      isActive: false,
      date: futureDate(),
      startTime: "10:00",
      maxPatients: 2,
      currentPatients: 0,
    });

    await expect(
      createAppointment({ userId: "u1", slotId: "s1", tests: ["t1"] })
    ).rejects.toBeInstanceOf(SlotNotFoundError);
  });

  it("throws PastSlotError when the slot is in the past", async () => {
    mockPrisma.test.findMany.mockResolvedValue([{ id: "t1", price: 100 }]);
    mockPrisma.timeslot.findUnique.mockResolvedValue({
      id: "s1",
      isActive: true,
      date: pastDate(),
      startTime: "10:00",
      maxPatients: 2,
      currentPatients: 0,
    });

    await expect(
      createAppointment({ userId: "u1", slotId: "s1", tests: ["t1"] })
    ).rejects.toBeInstanceOf(PastSlotError);
  });

  it("throws SlotFullError when the atomic reservation update matches nothing", async () => {
    mockPrisma.test.findMany.mockResolvedValue([{ id: "t1", price: 100 }]);
    mockPrisma.timeslot.findUnique.mockResolvedValue({
      id: "s1",
      isActive: true,
      date: futureDate(),
      startTime: "10:00",
      maxPatients: 2,
      currentPatients: 2,
    });
    mockPrisma.timeslot.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      createAppointment({ userId: "u1", slotId: "s1", tests: ["t1"] })
    ).rejects.toBeInstanceOf(SlotFullError);
  });

  it("throws InvalidAmountError when the total amount is not greater than zero", async () => {
    mockPrisma.test.findMany.mockResolvedValue([{ id: "t1", price: 0 }]);
    mockPrisma.timeslot.findUnique.mockResolvedValue({
      id: "s1",
      isActive: true,
      date: futureDate(),
      startTime: "10:00",
      maxPatients: 2,
      currentPatients: 0,
    });
    mockPrisma.timeslot.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      createAppointment({ userId: "u1", slotId: "s1", tests: ["t1"] })
    ).rejects.toBeInstanceOf(InvalidAmountError);
  });

  it("creates the appointment with the correct total amount and items on success", async () => {
    const validTests = [
      { id: "t1", price: 100 },
      { id: "t2", price: 250 },
    ];
    mockPrisma.test.findMany.mockResolvedValue(validTests);
    mockPrisma.timeslot.findUnique.mockResolvedValue({
      id: "s1",
      isActive: true,
      date: futureDate(),
      startTime: "10:00",
      maxPatients: 2,
      currentPatients: 0,
    });
    mockPrisma.timeslot.updateMany.mockResolvedValue({ count: 1 });
    const createdAppointment = { id: "appt_1", status: "PENDING" };
    mockPrisma.appointment.create.mockResolvedValue(createdAppointment);

    const result = await createAppointment({
      userId: "u1",
      slotId: "s1",
      tests: ["t1", "t2"],
    });

    expect(result).toBe(createdAppointment);
    expect(mockPrisma.appointment.create).toHaveBeenCalledTimes(1);

    const createArgs = mockPrisma.appointment.create.mock.calls[0][0];
    expect(createArgs.data.userId).toBe("u1");
    expect(createArgs.data.slotId).toBe("s1");
    expect(createArgs.data.status).toBe("PENDING");
    expect(createArgs.data.totalAmount).toBeInstanceOf(Prisma.Decimal);
    expect((createArgs.data.totalAmount as FakeDecimalInstance).toNumber()).toBe(350);
    expect(createArgs.data.items.create).toEqual([
      { testId: "t1", price: 100 },
      { testId: "t2", price: 250 },
    ]);
  });

  it("increments currentPatients atomically when reserving the slot", async () => {
    mockPrisma.test.findMany.mockResolvedValue([{ id: "t1", price: 100 }]);
    mockPrisma.timeslot.findUnique.mockResolvedValue({
      id: "s1",
      isActive: true,
      date: futureDate(),
      startTime: "10:00",
      maxPatients: 2,
      currentPatients: 1,
    });
    mockPrisma.timeslot.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.appointment.create.mockResolvedValue({ id: "appt_1" });

    await createAppointment({ userId: "u1", slotId: "s1", tests: ["t1"] });

    expect(mockPrisma.timeslot.updateMany).toHaveBeenCalledWith({
      where: {
        id: "s1",
        currentPatients: { lt: 2 },
        isActive: true,
      },
      data: {
        currentPatients: { increment: 1 },
      },
    });
  });

  it("converts a P2002 unique constraint violation into DuplicateBookingError", async () => {
    mockPrisma.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
      })
    );

    await expect(
      createAppointment({ userId: "u1", slotId: "s1", tests: ["t1"] })
    ).rejects.toBeInstanceOf(DuplicateBookingError);
  });

  it("re-throws non-P2002 prisma errors unchanged", async () => {
    const otherError = new Prisma.PrismaClientKnownRequestError("Some other error", {
      code: "P2025",
    });
    mockPrisma.$transaction.mockRejectedValue(otherError);

    await expect(
      createAppointment({ userId: "u1", slotId: "s1", tests: ["t1"] })
    ).rejects.toBe(otherError);
  });
});