import { prisma } from "../prisma";


export interface PaymentWebhookPayload {
    order_id: string;
    id: string;
    amount: number;
    currency: string;
    status: string;
}

export async function PaymentWebhookHandler(payload: PaymentWebhookPayload) {


    const payment = await prisma.payment.findUnique({
        where: {
            providerTxnId: payload.order_id
        },
        include: {
            appointment: true,
        }
    })
    if (!payment) {
        console.error("No payment found for order_id:", payload.order_id);
        return;
    }
    if (payment.isPaid) {
        return;
    }
    const amountInpaise = Math.round(payment.amount.toNumber() * 100);
    if (amountInpaise !== payload.amount) {
        console.error("Amount mismatch for order_id:", payload.order_id);
        return;
    }
    if (payment.currency !== payload.currency) {
        console.error("Currency mismatch for order_id:", payload.order_id);
        return;
    }
    if (payment.appointment.status !== "PENDING") {
        console.error("Payment already confirmed or appointment is not in pending state for order_id:", payload.order_id);
        return;
    }
    const transactionResult = await prisma.$transaction(async (tx) => {
        const result = await tx.payment.updateMany({
            where: {
                id: payment.id,
                isPaid: false,
            },
            data: {
                isPaid: true,
                providerPaymentId: payload.id,
                paidAt: new Date(),
                webhookVerified: true
            },
        })
        if (result.count === 0) {
            return;
        }
        const appointmentUpdated = await tx.appointment.updateMany({
            where: {
                id: payment.appointment.id,
                status: "PENDING",
            },
            data: {
                status: "CONFIRMED",
            }
        })
        if (appointmentUpdated.count === 0) {
            return;
        }
        const updateAppointmentStatus = await tx.appointment.update({
            where: {
                id: payment.appointment.id,
            },
            data: {
                status: "CONFIRMED",
            }
        })
        await tx.auditLog.create({
            data: {
                actorType: "SYSTEM",
                actorId: null,
                action: "PAYMENT_CONFIRMED",
                entity: "APPOINTMENT",
                entityId: payment.appointment.id,
                reason: "Razorpay payment.captured webhook",
                metadata: {
                    orderId: payload.order_id,
                    paymentId: payload.id,
                    amount: payload.amount,
                    currency: payload.currency,
                    provider: "RAZORPAY",
                },
            },
        })
        return {
            payment: result,
            appointment: updateAppointmentStatus,
        }

    })
    return transactionResult;
}