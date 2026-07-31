import { describe, expect, it, vi } from "vitest";

// `src/lib/auth.ts` wires up betterAuth with a Prisma adapter at import time.
// We stub out those side-effecting dependencies so we can safely import the
// module and assert on the plain values it exports (ROLES, etc.) without
// needing a real database connection.
vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

vi.mock("better-auth/adapters/prisma", () => ({
  prismaAdapter: vi.fn(() => ({})),
}));

vi.mock("better-auth/next-js", () => ({
  nextCookies: vi.fn(() => ({})),
}));

vi.mock("better-auth", () => ({
  betterAuth: vi.fn((config: unknown) => ({
    api: {},
    $Infer: { Session: undefined },
    __config: config,
  })),
}));

describe("ROLES", () => {
  it("only exposes USER and ADMIN roles", async () => {
    const { ROLES } = await import("./auth");

    expect(ROLES).toEqual({
      USER: "USER",
      ADMIN: "ADMIN",
    });
  });

  it("no longer exposes a LAB_STAFF role (regression)", async () => {
    const { ROLES } = await import("./auth");

    expect(ROLES).not.toHaveProperty("LAB_STAFF");
  });

  it("has exactly two role keys", async () => {
    const { ROLES } = await import("./auth");

    expect(Object.keys(ROLES).sort()).toEqual(["ADMIN", "USER"]);
  });
});

describe("auth instance", () => {
  it("is constructed using betterAuth with email/password enabled", async () => {
    const { betterAuth } = await import("better-auth");
    await import("./auth");

    expect(betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        emailAndPassword: expect.objectContaining({ enabled: true }),
      })
    );
  });
});