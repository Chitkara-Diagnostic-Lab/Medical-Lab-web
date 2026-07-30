
import Razorpay from 'razorpay'
import { prisma } from '../prisma';
import { Prisma } from '../../../generated/prisma/client';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

export interface CreatePaymentSessionInput {
    appointmentId: string
}


export async function CreateRazorpayOrder(data: CreatePaymentSessionInput) {
    const { appointmentId } = data;

    const appointment = await prisma.appointment.findUnique({
        where: {
            id: appointmentId,
        },
        include: {
            user: true,
            payment: true
        }
    })
    if (!appointment) {
        throw new Error("Appointment not found")
    }
    if (appointment.status !== "PENDING") {
        throw new Error("Appointment is not in pending state")
    }
    if (appointment.payment) {
        throw new Error("Payment has already been initiated for this appointment");
    }

    const amountInPaise = appointment.totalAmount * 100;
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
            userId: appointment.userId,
        }
    }
    const order = await razorpay.orders.create(orderOptions)

    try {
        const payment = await prisma.payment.create({
            data: {
                appointmentId,
                userId: appointment.userId,
                amount: appointment.totalAmount,
                provider: "RAZORPAY",
                providerTxnId: order.id,
                isPaid: false,
            }
        })
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new Error("Payment has already been initiated for this appointment")
        }
        throw error;
    }
    return {
        razorpayOrderId: order.id,
        amount: amountInPaise,
        currency: "INR",
    }

}