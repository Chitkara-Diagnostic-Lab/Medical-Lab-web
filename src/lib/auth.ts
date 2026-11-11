import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import  prisma  from "@/lib/prisma";
import { nextCookies } from "better-auth/next-js"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "USER",
        required: true,
        input: false
      }
    }
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ],
  // Add this to be more permissive in development
  advanced: {
    disableCSRFCheck: process.env.NODE_ENV === "development",
  },
});

export const ROLES = {
  USER: "USER" as const,
  LAB_STAFF: "LAB_STAFF" as const,
  ADMIN: "ADMIN" as const,
}as const;

export type Role = typeof ROLES[keyof typeof ROLES];
export type Session = typeof auth.$Infer.Session;