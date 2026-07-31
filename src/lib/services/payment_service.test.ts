import { beforeEach, describe, expect, it, vi } from "vitest";

// NOTE: vi.mock(...) factories are hoisted above regular declarations (and
// run before the mocked module is first imported anywhere in the module
// graph). Anything referenced inside a factory - and that also needs to be
// used from test bodies later - must therefore be created via vi.hoisted()
// so its initializer runs at the same hoisted position.
const { FakeDecimal, FakePrismaClientKnownRequestError, mockPrisma, ordersCreateMock } =
  vi.hoisted(() => {
    // Minimal Decimal stand-in mirroring the subset of the Prisma.Decimal
    // API used by payment_service.ts (mul, round, toNumber).
    class FakeDecimal {
      value: number;
      constructor(value: number | string | FakeDecimal) {
        this.value = value instanceof FakeDecimal ? value.value : Number(value);
      }
      mul(other: number | FakeDecimal) {
        const otherValue =
          other instanceof FakeDecimal ? other.value : Number(other);
        return new FakeDecimal(this.value * otherValue);
      }
      round() {
        return new FakeDecimal(Math.round(this.value));
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

    const mockPrisma = {
      appointment: { findFirst: vi.fn() },
      payment: { create: vi.fn(), findUnique: vi.fn() },
    };

    const ordersCreateMock = vi.fn();

    return { FakeDecimal, FakePrismaClientKnownRequestError, mockPrisma, ordersCreateMock };
  });

vi.mock("../../../generated/prisma/client", () => ({
  Prisma: {
    Decimal: FakeDecimal,
    PrismaClientKnownRequestError: FakePrismaClientKnownRequestError,
  },
}));

vi.mock("../prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("razorpay", () => ({
  default: vi.fn().mockImplementation(() => ({
    orders: { create: ordersCreateMock },
  })),
}));

import { Prisma } from "../../../generated/prisma/client";
import { CreatePaymentOrder } from "./payment_service";

describe("CreatePaymentOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when the appointment cannot be found for the given user", async () => {
    mockPrisma.appointment.findFirst.mockResolvedValue(null);

    await expect(
      CreatePaymentOrder({ appointmentId: "appt_1", userId: "user_1" })
    ).rejects.toThrow("Appointment not found");

    expect(mockPrisma.appointment.findFirst).toHaveBeenCalledWith({
      where: { id: "appt_1", userId: "user_1" },
      select: {
        userId: true,
        totalAmount: true,
        status: true,
        appointmentNumber: true,
        payment: true,
      },
    });
  });

  it("throws when the appointment is not in a pending state", async () => {
    mockPrisma.appointment.findFirst.mockResolvedValue({
      status: "CONFIRMED",
      totalAmount: new FakeDecimal(100),
      appointmentNumber: "APT-1",
      payment: null,
    });

    await expect(
      CreatePaymentOrder({ appointmentId: "appt_1", userId: "user_1" })
    ).rejects.toThrow("Appointment is not in pending state");
  });

  it("returns the existing order without calling razorpay when a payment already has a providerTxnId", async () => {
    mockPrisma.appointment.findFirst.mockResolvedValue({
      status: "PENDING",
      totalAmount: new FakeDecimal(100),
      appointmentNumber: "APT-1",
      payment: {
        providerTxnId: "order_existing",
        amount: new FakeDecimal(100),
        currency: "INR",
      },
    });

    const result = await CreatePaymentOrder({
      appointmentId: "appt_1",
      userId: "user_1",
    });

    expect(result).toEqual({
      razorpayOrderId: "order_existing",
      amount: 10000,
      currency: "INR",
    });
    expect(ordersCreateMock).not.toHaveBeenCalled();
    expect(mockPrisma.payment.create).not.toHaveBeenCalled();
  });

  it("throws when the calculated amount is not greater than zero", async () => {
    mockPrisma.appointment.findFirst.mockResolvedValue({
      status: "PENDING",
      totalAmount: new FakeDecimal(0),
      appointmentNumber: "APT-1",
      payment: null,
    });

    await expect(
      CreatePaymentOrder({ appointmentId: "appt_1", userId: "user_1" })
    ).rejects.toThrow("Invalid payment amount");
  });

  it("creates a new razorpay order and payment record using the passed-in userId", async () => {
    mockPrisma.appointment.findFirst.mockResolvedValue({
      status: "PENDING",
      totalAmount: new FakeDecimal(150),
      appointmentNumber: "APT-1",
      payment: null,
    });
    ordersCreateMock.mockResolvedValue({ id: "order_new" });
    mockPrisma.payment.create.mockResolvedValue({});

    const result = await CreatePaymentOrder({
      appointmentId: "appt_1",
      userId: "user_actual",
    });

    expect(ordersCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        receipt: "APT-1",
        amount: 15000,
        currency: "INR",
        notes: expect.objectContaining({
          appointmentId: "appt_1",
          userId: "user_actual",
        }),
      })
    );
    expect(mockPrisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        appointmentId: "appt_1",
        userId: "user_actual",
        provider: "RAZORPAY",
        providerTxnId: "order_new",
        isPaid: false,
      }),
    });
    expect(result).toEqual({
      razorpayOrderId: "order_new",
      amount: 15000,
      currency: "INR",
    });
  });

  it("wraps razorpay order creation failures in a user-friendly error", async () => {
    mockPrisma.appointment.findFirst.mockResolvedValue({
      status: "PENDING",
      totalAmount: new FakeDecimal(150),
      appointmentNumber: "APT-1",
      payment: null,
    });
    ordersCreateMock.mockRejectedValue(new Error("razorpay is down"));

    await expect(
      CreatePaymentOrder({ appointmentId: "appt_1", userId: "user_1" })
    ).rejects.toThrow("Unable to initiate payment. Please try again in a moment.");

    expect(mockPrisma.payment.create).not.toHaveBeenCalled();
  });

  it("returns the pre-existing payment record when creation races into a P2002 conflict", async () => {
    mockPrisma.appointment.findFirst.mockResolvedValue({
      status: "PENDING",
      totalAmount: new FakeDecimal(150),
      appointmentNumber: "APT-1",
      payment: null,
    });
    ordersCreateMock.mockResolvedValue({ id: "order_new" });
    mockPrisma.payment.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
      })
    );
    mockPrisma.payment.findUnique.mockResolvedValue({
      providerTxnId: "order_from_race",
      amount: new FakeDecimal(150),
      currency: "INR",
    });

    const result = await CreatePaymentOrder({
      appointmentId: "appt_1",
      userId: "user_1",
    });

    expect(result).toEqual({
      razorpayOrderId: "order_from_race",
      amount: 15000,
      currency: "INR",
    });
  });

  it("throws when a P2002 conflict occurs but no valid existing payment can be found", async () => {
    mockPrisma.appointment.findFirst.mockResolvedValue({
      status: "PENDING",
      totalAmount: new FakeDecimal(150),
      appointmentNumber: "APT-1",
      payment: null,
    });
    ordersCreateMock.mockResolvedValue({ id: "order_new" });
    mockPrisma.payment.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
      })
    );
    mockPrisma.payment.findUnique.mockResolvedValue(null);

    await expect(
      CreatePaymentOrder({ appointmentId: "appt_1", userId: "user_1" })
    ).rejects.toThrow("Payment record is in an invalid state. Please contact support.");
  });

  it("re-throws non-P2002 errors from payment.create unchanged", async () => {
    mockPrisma.appointment.findFirst.mockResolvedValue({
      status: "PENDING",
      totalAmount: new FakeDecimal(150),
      appointmentNumber: "APT-1",
      payment: null,
    });
    ordersCreateMock.mockResolvedValue({ id: "order_new" });
    const otherError = new Prisma.PrismaClientKnownRequestError("Other db error", {
      code: "P2025",
    });
    mockPrisma.payment.create.mockRejectedValue(otherError);

    await expect(
      CreatePaymentOrder({ appointmentId: "appt_1", userId: "user_1" })
    ).rejects.toBe(otherError);
  });
});