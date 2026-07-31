"use client"

import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export function LogoutButton() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleLogout = async () => {
        setIsLoading(true)
        try {
            await signOut({
                fetchOptions: {
                    onSuccess: () => {
                        toast.success("Logged out successfully")
                        router.push("/signin")
                    },
                    onError: (error) => {
                        toast.error("Failed to logout")
                    }
                }
            })
        } catch (error) {
            toast.error("An error occurred during logout")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={isLoading}
        >
            {isLoading ? "Logging out..." : "Logout"}
        </Button>
    )
}