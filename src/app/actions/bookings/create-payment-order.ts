"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CreatePaymentOrder } from "@/lib/services/payment_service";

export async function createPaymentOrderAction(appointmentId: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session || !session.user) {
            throw new Error("You need to login first (Unauthorized)");
        }

        const paymentDetails = await CreatePaymentOrder({
            appointmentId: appointmentId,
            userId: session.user.id
        });

        return {
            success: true,
            data: paymentDetails
        };
    } catch (error: unknown) {
        console.error("Error creating payment order:", error);
        if (error instanceof Error) {
            return {
                success: false,
                error: error.message
            }
        }
        return {
            success: false,
            error: "Payment order creation failed"
        };
    }
}
