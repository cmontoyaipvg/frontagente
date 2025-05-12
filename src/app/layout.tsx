import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/context/auth-context"
import ProtectedRoute from "@/components/protected-route"
import { ThemeProvider } from "@/components/theme-provider"
import { NuqsAdapter } from 'nuqs/adapters/next/app';
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TrilogIA",
  description: "Especialistas en Agentes",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
          <AuthProvider>
          <NuqsAdapter>
            <ProtectedRoute>{children}</ProtectedRoute>
            </NuqsAdapter>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
