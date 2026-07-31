import Razorpay from 'razorpay'
import { prisma } from '../prisma';
import { Prisma } from '../../../generated/prisma/client';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

export interface CreatePaymentSessionInput {
    appointmentId: string
    userId: string
}


export async function CreatePaymentOrder(data: CreatePaymentSessionInput) {
    const { appointmentId, userId } = data;

    const appointment = await prisma.appointment.findFirst({
        where: {
            id: appointmentId,
            userId,
        },
        select: {
            userId: true,
            totalAmount: true,
            status: true,
            appointmentNumber: true,
            payment: true,
        }
    })
    if (!appointment) {
        throw new Error("Appointment not found")
    }
    if (appointment.status !== "PENDING") {
        throw new Error("Appointment is not in pending state")
    }

    if (appointment.payment?.providerTxnId) {
        return {
            razorpayOrderId: appointment.payment.providerTxnId,
            amount: appointment.payment.amount.mul(100).round().toNumber(),
            currency: appointment.payment.currency,
        }
    }

    const amountInPaise = appointment.totalAmount.mul(100).round().toNumber();
    if (amountInPaise <= 0) {
        throw new Error("Invalid payment amount")
    }
    const orderOptions = {
        receipt: appointment.appointmentNumber,
        amount: amountInPaise,
        currency: "INR",
        payment_capture: 1,
        notes: {
            appointmentId: appointmentId,
            userId: userId,
        }
    }
    let order;
    try {
        order = await razorpay.orders.create(orderOptions)
    }
    catch (error) {
        console.error("Razorpay order creation failed:", error);
        throw new Error("Unable to initiate payment. Please try again in a moment.")
    }

    try {
        await prisma.payment.create({
            data: {
                appointmentId,
                userId: userId,
                amount: appointment.totalAmount,
                provider: "RAZORPAY",
                providerTxnId: order.id,
                isPaid: false,
            }
        })
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            const existingPayment = await prisma.payment.findUnique({
                where: { appointmentId },
                select: {
                    providerTxnId: true,
                    amount: true,
                    currency: true,
                }
            })
            if (existingPayment?.providerTxnId) {
                return {
                    razorpayOrderId: existingPayment.providerTxnId,
                    amount: existingPayment.amount.mul(100).round().toNumber(),
                    currency: existingPayment.currency,
                }
            }
            throw new Error("Payment record is in an invalid state. Please contact support.")
        }
        throw error;
    }
    return {
        razorpayOrderId: order.id,
        amount: amountInPaise,
        currency: "INR",
    }
}