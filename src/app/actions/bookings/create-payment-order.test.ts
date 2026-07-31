import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("@/lib/services/payment_service", () => ({
  CreatePaymentOrder: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { CreatePaymentOrder } from "@/lib/services/payment_service";
import { createPaymentOrderAction } from "./create-payment-order";

const mockedGetSession = vi.mocked(auth.api.getSession);
const mockedCreatePaymentOrder = vi.mocked(CreatePaymentOrder);

describe("createPaymentOrderAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns a failure when there is no session", async () => {
    mockedGetSession.mockResolvedValue(null as never);

    const result = await createPaymentOrderAction("appt_1");

    expect(result).toEqual({
      success: false,
      error: "You need to login first (Unauthorized)",
    });
    expect(mockedCreatePaymentOrder).not.toHaveBeenCalled();
  });

  it("returns a failure when the session has no user", async () => {
    mockedGetSession.mockResolvedValue({ user: null } as never);

    const result = await createPaymentOrderAction("appt_1");

    expect(result.success).toBe(false);
    expect(mockedCreatePaymentOrder).not.toHaveBeenCalled();
  });

  it("creates a payment order for an authenticated user", async () => {
    mockedGetSession.mockResolvedValue({
      user: { id: "user_123" },
    } as never);
    mockedCreatePaymentOrder.mockResolvedValue({
      razorpayOrderId: "order_abc",
      amount: 10000,
      currency: "INR",
    });

    const result = await createPaymentOrderAction("appt_1");

    expect(mockedCreatePaymentOrder).toHaveBeenCalledWith({
      appointmentId: "appt_1",
      userId: "user_123",
    });
    expect(result).toEqual({
      success: true,
      data: {
        razorpayOrderId: "order_abc",
        amount: 10000,
        currency: "INR",
      },
    });
  });

  it("returns the error message when CreatePaymentOrder throws an Error", async () => {
    mockedGetSession.mockResolvedValue({
      user: { id: "user_123" },
    } as never);
    mockedCreatePaymentOrder.mockRejectedValue(
      new Error("Appointment not found")
    );

    const result = await createPaymentOrderAction("appt_missing");

    expect(result).toEqual({
      success: false,
      error: "Appointment not found",
    });
  });

  it("returns a generic error message when a non-Error value is thrown", async () => {
    mockedGetSession.mockResolvedValue({
      user: { id: "user_123" },
    } as never);
    mockedCreatePaymentOrder.mockRejectedValue("unexpected string failure");

    const result = await createPaymentOrderAction("appt_1");

    expect(result).toEqual({
      success: false,
      error: "Payment order creation failed",
    });
  });
});