import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const tests = await prisma.test.findMany({
            where: {
                isActive: true
            },
            select: {
                id: true,
                name: true,
                price: true,
                duration: true,
                category: true,
                description: true
            },
            orderBy: {
                name: "asc"
            }
        })
        return NextResponse.json({ tests }, { status: 200 })
    } catch (error) {
        console.log("Error fetching tests", error)
        return NextResponse.json({ error: "Failed to fetch tests" }, { status: 500 })
    }
}