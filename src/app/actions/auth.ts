'use server';

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { formSchema, LoginSchema } from "@/lib/validation/auth_zod";

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
        return { 
            success: false, 
            error: ""
        };
    }

    try {
        const result = await auth.api.signUpEmail({
            body: {
                email: parsed.data.email,
                password: parsed.data.password,
                name: parsed.data.name,
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

    redirect('/me/dashboard');
}

export async function signInAction(
    _prevState: ActionResult | null,
    formData: FormData
): Promise<ActionResult> {
    const rawData = {
        email: formData.get('email'),
        password: formData.get('password'),
    };

    // Validate with Zod
    const parsed = LoginSchema.safeParse(rawData);
    if (!parsed.success) {
        return { 
            success: false, 
            error: ""
        };
    }

    try {
        const result = await auth.api.signInEmail({
            body: {
                email: parsed.data.email,
                password: parsed.data.password,
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

    redirect('/me/dashboard');
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