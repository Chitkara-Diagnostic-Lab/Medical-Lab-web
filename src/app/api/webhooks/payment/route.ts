import { PaymentWebhookHandler } from '@/lib/services/payment_webhook';
import crypto from 'crypto'
import { NextResponse } from "next/server";



export async function verifySignature(
    body: string,
    signature: string
) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
        throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured");
    }

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (signatureBuffer.length !== expectedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        expectedBuffer,
        signatureBuffer
    );
}

export async function POST(request: Request) {

    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
        return NextResponse.json({ message: "Invalid request headers", success: false }, { status: 400 });
    }

    const isvalid = await verifySignature(body, signature);

    if (!isvalid) {
        return NextResponse.json({ message: "Invalid request", success: false }, { status: 400 });
    }

    let parsedbody;
    try {
        parsedbody = JSON.parse(body);
    } catch (error) {
        console.error("Failed to parse webhook body", error);
        return NextResponse.json({ message: "Invalid request body", success: false }, { status: 400 });
    }

    const event = parsedbody.event;
    const payload = parsedbody.payload;

    if (event === 'payment.captured') {

        try {
            const payment = payload.payment.entity;
            await PaymentWebhookHandler(
                {
                    order_id: payment.order_id,
                    id: payment.id,
                    amount: payment.amount,
                    currency: payment.currency,
                    status: payment.status,
                }
            );
        } catch (error) {
            console.error("Webhook handler failed", error);
            return NextResponse.json({ message: "Webhook handler failed", success: false }, { status: 500 });
        }
    }

    console.log("Webhook hit");
    return NextResponse.json({ message: "webhook hit ", success: true });

}
