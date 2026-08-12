import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Starting database seed...");


    const slots = [];

    for (let day = 1; day <= 7; day++) {
        const date = new Date();
        date.setDate(date.getDate() + day);
        date.setHours(0, 0, 0, 0);

        for (let hour = 9; hour < 17; hour++) {
            for (const minute of [0, 30]) {
                const startTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

                const endHour = minute === 30 ? hour + 1 : hour;
                const endMinute = minute === 30 ? 0 : 30;

                const endTime = `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;

                slots.push({
                    date,
                    startTime,
                    endTime,
                    currentPatients: 0,
                    maxPatients: 5,
                    isActive: true,
                });
            }
        }
    }

    for (const slot of slots) {
        await prisma.timeslot.upsert({
            where: {
                date_startTime: {
                    date: slot.date,
                    startTime: slot.startTime,
                },
            },
            update: {
                endTime: slot.endTime,
                maxPatients: slot.maxPatients,
                isActive: true,
            },
            create: slot,
        });
    }

    console.log(`✅ ${slots.length} timeslots seeded`);
}
main()
    .catch((error) => {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

