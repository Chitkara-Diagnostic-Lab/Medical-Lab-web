import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// Set BEFORE importing route.ts
process.env.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret";

const mocks = vi.hoisted(() => ({
    webhookHandler: vi.fn(),
}));

vi.mock("@/lib/services/payment_webhook", () => ({
    PaymentWebhookHandler: mocks.webhookHandler,
}));

import { POST } from "./route";


const createSignature = (body: string) => {
    return crypto
        .createHmac("sha256", "test_webhook_secret")
        .update(body)
        .digest("hex");
};


describe("POST /api/webhooks/payment", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });


    it("should reject request without signature", async () => {

        const request = new Request(
            "http://localhost/api/webhooks/payment",
            {
                method: "POST",
                body: JSON.stringify({}),
            }
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);

        expect(data).toEqual({
            message: "Invalid request headers",
            success: false,
        });

        expect(mocks.webhookHandler).not.toHaveBeenCalled();
    });


    it("should reject request with invalid signature", async () => {

        const body = JSON.stringify({
            event: "payment.captured",
        });

        const request = new Request(
            "http://localhost/api/webhooks/payment",
            {
                method: "POST",
                headers: {
                    "x-razorpay-signature": "invalid-signature",
                },
                body,
            }
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);

        expect(data).toEqual({
            message: "Invalid request",
            success: false,
        });

        expect(mocks.webhookHandler).not.toHaveBeenCalled();
    });


    it("should reject invalid JSON", async () => {

        const body = "this is not valid json";

        const signature = createSignature(body);

        const request = new Request(
            "http://localhost/api/webhooks/payment",
            {
                method: "POST",
                headers: {
                    "x-razorpay-signature": signature,
                },
                body,
            }
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);

        expect(data).toEqual({
            message: "Invalid request body",
            success: false,
        });

        expect(mocks.webhookHandler).not.toHaveBeenCalled();
    });


    it("should call webhook handler for payment.captured", async () => {

        const body = JSON.stringify({
            event: "payment.captured",
            payload: {
                payment: {
                    entity: {
                        order_id: "order_123",
                        id: "payment_123",
                        amount: 50000,
                        currency: "INR",
                        status: "captured",
                    },
                },
            },
        });

        const signature = createSignature(body);

        mocks.webhookHandler.mockResolvedValue(undefined);

        const request = new Request(
            "http://localhost/api/webhooks/payment",
            {
                method: "POST",
                headers: {
                    "x-razorpay-signature": signature,
                },
                body,
            }
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);

        expect(data.success).toBe(true);

        expect(mocks.webhookHandler).toHaveBeenCalledWith({
            order_id: "order_123",
            id: "payment_123",
            amount: 50000,
            currency: "INR",
            status: "captured",
        });
    });


    it("should return 500 when webhook handler fails", async () => {

        const body = JSON.stringify({
            event: "payment.captured",
            payload: {
                payment: {
                    entity: {
                        order_id: "order_123",
                        id: "payment_123",
                        amount: 50000,
                        currency: "INR",
                        status: "captured",
                    },
                },
            },
        });

        const signature = createSignature(body);

        mocks.webhookHandler.mockRejectedValue(
            new Error("Database failure")
        );

        const request = new Request(
            "http://localhost/api/webhooks/payment",
            {
                method: "POST",
                headers: {
                    "x-razorpay-signature": signature,
                },
                body,
            }
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);

        expect(data).toEqual({
            message: "Webhook handler failed",
            success: false,
        });
    });

});