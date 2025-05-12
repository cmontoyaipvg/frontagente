"use client"

import type React from "react"

import { useAuth } from "@/context/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !user && pathname !== "/login") {
      console.log("No user found, redirecting to login")
      router.push("/login")
    }
  }, [user, isLoading, router, pathname])

  // Si estamos en la página de login y hay un usuario, redirigir a /chat
  useEffect(() => {
    if (!isLoading && user && pathname === "/login") {
      router.push("/chat")
    }
  }, [user, isLoading, router, pathname])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user && pathname !== "/login") {
    return null
  }

  return <>{children}</>
}
