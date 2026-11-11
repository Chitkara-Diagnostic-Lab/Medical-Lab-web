import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
    getSession: vi.fn(),
    headers: vi.fn(),
    createPaymentOrder: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
    auth: {
        api: {
            getSession: mocks.getSession,
        },
    },
}));

vi.mock("next/headers", () => ({
    headers: mocks.headers,
}));

vi.mock("@/lib/services/payment_service", () => ({
    CreatePaymentOrder: mocks.createPaymentOrder,
}));

import { createPaymentOrderAction } from "./create-payment-order";

describe("createPaymentOrderAction", () => {

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.headers.mockResolvedValue(new Headers());
    });

    it("should reject unauthenticated users", async () => {

        mocks.getSession.mockResolvedValue(null);

        const result = await createPaymentOrderAction(
            "appointment-123"
        );

        expect(result).toEqual({
            success: false,
            error: "You need to login first (Unauthorized)",
        });

        expect(mocks.createPaymentOrder).not.toHaveBeenCalled();
    });


    it("should create payment order for authenticated user", async () => {

        mocks.getSession.mockResolvedValue({
            user: {
                id: "user-123",
            },
        });

        mocks.createPaymentOrder.mockResolvedValue({
            razorpayOrderId: "order_123",
            amount: 50000,
            currency: "INR",
        });

        const result = await createPaymentOrderAction(
            "appointment-123"
        );

        expect(mocks.createPaymentOrder).toHaveBeenCalledWith({
            appointmentId: "appointment-123",
            userId: "user-123",
        });

        expect(result).toEqual({
            success: true,
            data: {
                razorpayOrderId: "order_123",
                amount: 50000,
                currency: "INR",
            },
        });
    });


    it("should return an error when payment service fails", async () => {

        mocks.getSession.mockResolvedValue({
            user: {
                id: "user-123",
            },
        });

        mocks.createPaymentOrder.mockRejectedValue(
            new Error("Appointment not found")
        );

        const result = await createPaymentOrderAction(
            "appointment-123"
        );

        expect(result).toEqual({
            success: false,
            error: "Appointment not found",
        });
    });

});