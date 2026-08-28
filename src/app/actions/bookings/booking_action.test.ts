import { describe, it, expect, vi, beforeEach } from "vitest";
import { createBookingAction } from "./create-booking";

vi.mock("@/lib/server-auth", () => ({
    requireAuth: vi.fn(),
}));

vi.mock("@/lib/services/booking_service", () => ({
    createAppointment: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    redirect: vi.fn(),
}));

import { requireAuth } from "@/lib/server-auth";
import { createAppointment } from "@/lib/services/booking_service";
import { redirect } from "next/navigation";

describe("createBookingAction", () => {
    const testId = "cm123456789012345678901235";
    const slotId = "cm987654321098765432109877";

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should create booking and redirect to payment", async () => {
        vi.mocked(requireAuth).mockResolvedValue({
            user: {
                id: "user-1234",
                role: "USER",
            },
        } as any);

        vi.mocked(createAppointment).mockResolvedValue({
            id: "appointment-123",
        } as any);

        await createBookingAction(
            [testId],
            slotId
        );

        expect(createAppointment).toHaveBeenCalledWith({
            userId: "user-1234",
            tests: [testId],
            slotId,
        });

        expect(redirect).toHaveBeenCalledWith(
            "/payment/appointment-123"
        );
    });

    it("should reject non-patient users", async () => {
        vi.mocked(requireAuth).mockResolvedValue({
            user: {
                id: "admin-123",
                role: "ADMIN",
            },
        } as any);

        const result = await createBookingAction(
            [testId],
            slotId
        );

        expect(result).toEqual({
            error: "Only patients can create bookings",
        });

        expect(createAppointment).not.toHaveBeenCalled();

        expect(redirect).not.toHaveBeenCalled();
    });
    it("should return an error when booking creation fails", async () => {
        vi.mocked(requireAuth).mockResolvedValue({
            user: {
                id: "user-123",
                role: "USER",
            },
        } as any);

        vi.mocked(createAppointment).mockRejectedValue(
            new Error("Slot is already full")
        );

        const result = await createBookingAction(
            [testId],
            slotId
        );

        expect(result).toEqual({
            error: "Slot is already full",
        });

        expect(redirect).not.toHaveBeenCalled();
    });
});