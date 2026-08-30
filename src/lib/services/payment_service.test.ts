import { describe, it, expect, vi, beforeEach } from "vitest";



const mocks = vi.hoisted(() => ({
    findFirst: vi.fn(),
    paymentFindUnique: vi.fn(),
    paymentCreate: vi.fn(),
    razorpayCreate: vi.fn(),
}));

vi.mock("../prisma", () => ({
    prisma: {
        appointment: {
            findFirst: mocks.findFirst,
        },
        payment: {
            findUnique: mocks.paymentFindUnique,
            create: mocks.paymentCreate,
        },
    },
}));

vi.mock("razorpay", () => {
    return {
        default: class Razorpay {
            orders = {
                create: mocks.razorpayCreate,
            };
        },
    };
});

import { CreatePaymentOrder } from "./payment_service";

describe("CreatePaymentOrder", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should reject when appointment does not exist", async () => {

        mocks.findFirst.mockResolvedValue(null);

        await expect(
            CreatePaymentOrder({
                appointmentId: "appointment-123",
                userId: "user-123",
            })
        ).rejects.toThrow("Appointment not found");

        expect(mocks.razorpayCreate).not.toHaveBeenCalled();
    });


    it("should reject appointment that is not pending", async () => {

        mocks.findFirst.mockResolvedValue({
            userId: "user-123",
            totalAmount: {
                mul: vi.fn(),
            },
            status: "CONFIRMED",
            appointmentNumber: "APT-123",
            payment: null,
        });

        await expect(
            CreatePaymentOrder({
                appointmentId: "appointment-123",
                userId: "user-123",
            })
        ).rejects.toThrow("Appointment is not in pending state");

        expect(mocks.razorpayCreate).not.toHaveBeenCalled();
    });


    it("should return existing payment order instead of creating another one", async () => {

        const amount = {
            mul: vi.fn().mockReturnValue({
                round: vi.fn().mockReturnValue({
                    toNumber: vi.fn().mockReturnValue(50000),
                }),
            }),
        };

        mocks.findFirst.mockResolvedValue({
            userId: "user-123",
            totalAmount: amount,
            status: "PENDING",
            appointmentNumber: "APT-123",
            payment: {
                providerTxnId: "order_existing_123",
                amount,
                currency: "INR",
            },
        });

        const result = await CreatePaymentOrder({
            appointmentId: "appointment-123",
            userId: "user-123",
        });

        expect(result).toEqual({
            razorpayOrderId: "order_existing_123",
            amount: 50000,
            currency: "INR",
        });

        expect(mocks.razorpayCreate).not.toHaveBeenCalled();
    });


    it("should create a Razorpay order and payment record", async () => {

        const decimalAmount = {
            mul: vi.fn().mockReturnValue({
                round: vi.fn().mockReturnValue({
                    toNumber: vi.fn().mockReturnValue(50000),
                }),
            }),
        };

        mocks.findFirst.mockResolvedValue({
            userId: "user-123",
            totalAmount: decimalAmount,
            status: "PENDING",
            appointmentNumber: "APT-123",
            payment: null,
        });

        mocks.razorpayCreate.mockResolvedValue({
            id: "order_razorpay_123",
        });

        mocks.paymentCreate.mockResolvedValue({
            id: "payment-123",
        });

        const result = await CreatePaymentOrder({
            appointmentId: "appointment-123",
            userId: "user-123",
        });

        expect(mocks.razorpayCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                receipt: "APT-123",
                amount: 50000,
                currency: "INR",
                payment_capture: 1,
                notes: {
                    appointmentId: "appointment-123",
                    userId: "user-123",
                },
            })
        );

        expect(mocks.paymentCreate).toHaveBeenCalledWith({
            data: {
                appointmentId: "appointment-123",
                userId: "user-123",
                amount: decimalAmount,
                provider: "RAZORPAY",
                providerTxnId: "order_razorpay_123",
                isPaid: false,
            },
        });

        expect(result).toEqual({
            razorpayOrderId: "order_razorpay_123",
            amount: 50000,
            currency: "INR",
        });
    });


    it("should reject invalid payment amount", async () => {

        const invalidAmount = {
            mul: vi.fn().mockReturnValue({
                round: vi.fn().mockReturnValue({
                    toNumber: vi.fn().mockReturnValue(0),
                }),
            }),
        };

        mocks.findFirst.mockResolvedValue({
            userId: "user-123",
            totalAmount: invalidAmount,
            status: "PENDING",
            appointmentNumber: "APT-123",
            payment: null,
        });

        await expect(
            CreatePaymentOrder({
                appointmentId: "appointment-123",
                userId: "user-123",
            })
        ).rejects.toThrow("Invalid payment amount");

        expect(mocks.razorpayCreate).not.toHaveBeenCalled();
    });

});