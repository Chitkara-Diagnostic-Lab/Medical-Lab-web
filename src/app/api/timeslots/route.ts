import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSlotInFuture } from "@/lib/utils/date";

interface TimeslotResponse {
    id: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    seatsLeft: number;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get("from");
        const to = searchParams.get("to");

        if (!from || !to) {
            return NextResponse.json(
                { error: "Please provide from and to date" },
                { status: 400 }
            );
        }

        const fromDate = new Date(from);
        const toDate = new Date(to);

        // guard against garbage query strings like ?from=banana
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            return NextResponse.json(
                { error: "Invalid date format" },
                { status: 400 }
            );
        }

        const timeslots = await prisma.timeslot.findMany({
            where: {
                date: {
                    gte: fromDate,
                    lte: toDate,
                },
                isActive: true,
            },
            select: {
                id: true,
                date: true,
                startTime: true,
                endTime: true,
                currentPatients: true,
                maxPatients: true,
            },
            orderBy: [
                { date: "asc" },
                { startTime: "asc" },
            ],
        });

        const grouped = timeslots.reduce((acc, slot) => {
            const dateKey = slot.date.toISOString().split("T")[0];

            const isAvailable =
                slot.currentPatients < slot.maxPatients &&
                isSlotInFuture(slot.date, slot.startTime);

            const seatsLeft = Math.max(slot.maxPatients - slot.currentPatients, 0);

            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }

            acc[dateKey].push({
                id: slot.id,
                startTime: slot.startTime,
                endTime: slot.endTime,
                isAvailable,
                seatsLeft,
            });

            return acc;
        }, {} as Record<string, TimeslotResponse[]>);

        return NextResponse.json({ timeslots: grouped }, { status: 200 });
    } catch (error) {
        console.log("Error fetching timeslots", error);
        return NextResponse.json(
            { error: "Failed to fetch timeslots" },
            { status: 500 }
        );
    }
}