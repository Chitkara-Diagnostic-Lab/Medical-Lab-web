import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
    findUnique: vi.fn(),
    paymentUpdateMany: vi.fn(),
    appointmentUpdateMany: vi.fn(),
    auditLogCreate: vi.fn(),
}));

vi.mock("../prisma", () => ({
    prisma: {
        payment: {
            findUnique: mocks.findUnique,
        },

        $transaction: async (callback: Function) => {
            return callback({
                payment: {
                    updateMany: mocks.paymentUpdateMany,
                },
                appointment: {
                    updateMany: mocks.appointmentUpdateMany,
                },
                auditLog: {
                    create: mocks.auditLogCreate,
                },
            });
        },
    },
}));

import { PaymentWebhookHandler } from "./payment_webhook";

describe("PaymentWebhookHandler", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const payload = {
        order_id: "order_123",
        id: "payment_123",
        amount: 50000,
        currency: "INR",
        status: "captured",
    };

    it("should safely return when payment is not found", async () => {

        mocks.findUnique.mockResolvedValue(null);

        await PaymentWebhookHandler(payload);

        expect(mocks.paymentUpdateMany).not.toHaveBeenCalled();
        expect(mocks.appointmentUpdateMany).not.toHaveBeenCalled();
    });


    it("should safely return when payment is already paid", async () => {

        mocks.findUnique.mockResolvedValue({
            id: "payment-db-123",
            isPaid: true,
        });

        await PaymentWebhookHandler(payload);

        expect(mocks.paymentUpdateMany).not.toHaveBeenCalled();
    });


    it("should not confirm payment when amount does not match", async () => {

        mocks.findUnique.mockResolvedValue({
            id: "payment-db-123",
            isPaid: false,
            amount: {
                toNumber: () => 500,
            },
            currency: "INR",
            appointment: {
                id: "appointment-123",
                status: "PENDING",
            },
        });

        const wrongPayload = {
            ...payload,
            amount: 99999,
        };

        await PaymentWebhookHandler(wrongPayload);

        expect(mocks.paymentUpdateMany).not.toHaveBeenCalled();
        expect(mocks.appointmentUpdateMany).not.toHaveBeenCalled();
    });


    it("should not confirm payment when currency does not match", async () => {

        mocks.findUnique.mockResolvedValue({
            id: "payment-db-123",
            isPaid: false,
            amount: {
                toNumber: () => 500,
            },
            currency: "INR",
            appointment: {
                id: "appointment-123",
                status: "PENDING",
            },
        });

        await PaymentWebhookHandler({
            ...payload,
            currency: "USD",
        });

        expect(mocks.paymentUpdateMany).not.toHaveBeenCalled();
    });


    it("should confirm payment and appointment for valid webhook", async () => {

        mocks.findUnique.mockResolvedValue({
            id: "payment-db-123",
            isPaid: false,
            amount: {
                toNumber: () => 500,
            },
            currency: "INR",
            appointment: {
                id: "appointment-123",
                status: "PENDING",
            },
        });

        mocks.paymentUpdateMany.mockResolvedValue({
            count: 1,
        });

        mocks.appointmentUpdateMany.mockResolvedValue({
            count: 1,
        });

        mocks.auditLogCreate.mockResolvedValue({
            id: "audit-123",
        });

        await PaymentWebhookHandler(payload);

        expect(mocks.paymentUpdateMany).toHaveBeenCalledWith({
            where: {
                id: "payment-db-123",
                isPaid: false,
            },
            data: expect.objectContaining({
                isPaid: true,
                providerPaymentId: "payment_123",
                webhookVerified: true,
            }),
        });

        expect(mocks.appointmentUpdateMany).toHaveBeenCalledWith({
            where: {
                id: "appointment-123",
                status: "PENDING",
            },
            data: {
                status: "CONFIRMED",
            },
        });

        expect(mocks.auditLogCreate).toHaveBeenCalled();

    });

});