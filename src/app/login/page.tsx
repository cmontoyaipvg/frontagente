"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Info } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("usuario")
  const [password, setPassword] = useState("demo")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { login } = useAuth()
  const usernameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (usernameInputRef.current) {
      usernameInputRef.current.focus()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simulamos una carga breve para la UX
    setTimeout(() => {
      try {
        // Usuario demo predefinido
        login({
          id: "DEMO001",
          name: "Usuario Demo",
          email: username,
          perfil: "1",
          codSucursal: "001",
        })

        router.push("/chat")
      } catch (err) {
        console.error("Login error:", err)
        setError("Ocurrió un error al iniciar sesión. Intenta de nuevo.")
      } finally {
        setIsLoading(false)
      }
    }, 800) // Retraso simulado de 800ms
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Remove any @ characters
    const sanitizedValue = value.replace(/@/g, "")
    setUsername(sanitizedValue)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0f172a] to-[#020617]">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[15%] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] right-[10%] w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md border-0 bg-[#131525]/60 backdrop-blur-sm shadow-xl rounded-xl">
        <div className="flex justify-center pt-8">
          {/* Logo con texto para TrilogIA */}
          <div className="text-center">
            <h1 className="text-4xl font-bold">
              <span className="text-white">Trilog</span>
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">IA</span>
            </h1>
            <div className="mt-1 text-xs text-blue-300/80">ASISTENTE INTELIGENTE</div>
          </div>
        </div>
        
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl text-center text-white">Plataforma de Agentes</CardTitle>
          <CardDescription className="text-center text-gray-400">
            Ingresa con el usuario demo para continuar
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="mb-4 p-2 rounded-md bg-red-900/20 border border-red-800">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          
          {/* Notificación de modo demo */}
          <div className="mb-4 p-2.5 rounded-md bg-blue-900/20 border border-blue-800 flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-300">
              Modo de demostración activo. Usa las credenciales predeterminadas para acceder directamente.
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="username" className="text-gray-300 text-sm">
                  Usuario
                </Label>
                <div className="relative">
                  <input
                    ref={usernameInputRef}
                    id="username"
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    className="flex h-10 w-full rounded-md border border-[#2e3348] bg-[#1a1d29] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0d14] transition-all"
                    required
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-gray-300 text-sm">
                  Contraseña
                </Label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-[#2e3348] bg-[#1a1d29] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0d14] transition-all"
                  required
                />
              </div>
            </div>
            
            <Button 
              className="mt-8 w-full h-11 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-blue-900/20 transition-all"
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : null}
              Ingresar
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-xs">
              © 2025 TrilogIA. Todos los derechos reservados.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}