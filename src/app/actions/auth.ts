'use server';

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { formSchema } from "@/lib/validation/auth_zod";

// Type for action responses
export type ActionResult =
    | { success: true; message: string }
    | { success: false; error: string };

export async function signUpAction(
    _prevState: ActionResult | null,
    formData: FormData
): Promise<ActionResult> {
    const rawData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
    };

    // Validate with Zod
    const parsed = formSchema.safeParse(rawData);
    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message ?? "Validation failed";
        return {
            success: false,
            error: firstError
        };
    }

    try {
        const result = await auth.api.signUpEmail({
            body: {
                name: parsed.data.name,
                email: parsed.data.email,
                password: parsed.data.password,
            },
            headers: await headers(),
        });

        if (!result) {
            return {
                success: false,
                error: "Failed to create account"
            };
        }
    } catch (error) {
        console.error("Sign up error:", error);
        return {
            success: false,
            error: "Something went wrong. Please try again."
        };
    }

    redirect('/');
}

export async function signInAction(
    _prevState: ActionResult | null,
    formData: FormData
): Promise<ActionResult> {
    const email = formData.get('email');
    const password = formData.get('password');

    if (typeof email !== 'string' || typeof password !== 'string') {
        return {
            success: false,
            error: "Invalid email or password"
        };
    }

    try {
        const result = await auth.api.signInEmail({
            body: {
                email,
                password,
            },
            headers: await headers(),
        });

        if (!result) {
            return {
                success: false,
                error: "Invalid email or password"
            };
        }
    } catch (error) {
        console.error("Sign in error:", error);
        return {
            success: false,
            error: "Invalid email or password"
        };
    }

    redirect('/');
}

export async function signOutAction(): Promise<ActionResult> {
    try {
        await auth.api.signOut({
            headers: await headers(),
        });
    } catch (error) {
        console.error("Sign out error:", error);
        return {
            success: false,
            error: "Failed to sign out"
        };
    }

    redirect('/signin');
}