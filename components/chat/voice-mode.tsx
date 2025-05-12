'use client';

import { useState, useEffect, useRef } from "react"
import { X, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { WebRTCConnection } from '@/lib/realtime/realtimeConnection'

interface VoiceModeProps {
  onClose: () => void
  onConnect: () => void
  isConnected: boolean
  isMobile?: boolean
}

export function VoiceMode({ onClose, onConnect, isConnected }: VoiceModeProps) {
  const [rotation, setRotation] = useState(0)
  const connRef = useRef<WebRTCConnection | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Efecto para animar el círculo
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      setRotation((prev) => (prev + 1) % 360)
    }, 50)

    return () => clearInterval(interval)
  }, [isConnected])

  const startVoice = async () => {
    if (!connRef.current) {
      connRef.current = new WebRTCConnection(
        (txt, isUser) => console.log(txt),  // Manejo de transcripción
        (status) => console.log('Status:', status),
        (tool) => console.log('Tool:', tool)
      )
    }
    const initialized = await connRef.current.initialize()
    if (initialized) {
      const connected = await connRef.current.connect()
      if (connected) {
        // Reproducir audio remoto
        if (audioRef.current && connected) {
          audioRef.current.srcObject = connected
          audioRef.current.play()
        }
        onConnect()  // Actualiza el estado de conexión en el componente padre
      }
    }
  }

  const stopVoice = () => {
    connRef.current?.disconnect()
    onConnect()  // Actualiza el estado de desconexión en el componente padre
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-r from-[#1f1f1f] to-[#0a0d14] bg-opacity-95 rounded-lg shadow-lg">
      {/* Botón para cerrar */}
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-[#2c2f38] focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-full p-2"
        >
          <X className="h-6 w-6" />
          <span className="sr-only">Cerrar modo de voz</span>
        </Button>
      </div>
  
      {/* Círculo animado */}
      <div className="relative mb-10">
        {/* Círculo exterior */}
        <div
          className={cn(
            "relative flex h-72 w-72 items-center justify-center rounded-full transition-all ease-in-out duration-300",
            isConnected ? "bg-gradient-to-r from-[#0c77b8] to-[#56a8ff]" : "bg-[#2b2f37]"
          )}
        >
          {/* Círculo medio con rotación */}
          <div
            className={cn(
              "absolute h-56 w-56 rounded-full transition-transform duration-500 ease-in-out",
              isConnected ? "bg-[#0d93d6] bg-opacity-30" : "bg-[#3d454f] bg-opacity-50"
            )}
            style={{
              transform: isConnected ? `rotate(${rotation}deg)` : "none",
            }}
          >
            {/* Puntos decorativos en el círculo medio */}
            {isConnected && (
              <>
                <div className="absolute top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-[#3498db]" />
                <div className="absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#2980b9]" />
                <div className="absolute bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-[#3498db]" />
                <div className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#2980b9]" />
              </>
            )}
          </div>
  
          {/* Círculo interior pulsante */}
          <div
            className={cn(
              "flex h-40 w-40 items-center justify-center rounded-full transition-all duration-800 ease-in-out",
              isConnected ? "animate-pulse bg-[#007c92] text-white" : "bg-[#2f383e] text-[#8d8f95]"
            )}
          >
            <Mic className="h-14 w-14" />
          </div>
        </div>
  
        {/* Ondas de sonido animadas cuando está conectado */}
        {isConnected && (
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 animate-ping rounded-full bg-[#3498db] opacity-20 [animation-duration:3s]" />
            <div className="absolute inset-0 animate-ping rounded-full bg-[#3498db] opacity-20 [animation-delay:0.5s] [animation-duration:3s]" />
            <div className="absolute inset-0 animate-ping rounded-full bg-[#3498db] opacity-20 [animation-delay:1s] [animation-duration:3s]" />
          </div>
        )}
      </div>
  
      {/* Texto de estado */}
      <div className="mb-6 text-center px-6">
        <h2 className="text-3xl font-semibold text-white">{isConnected ? "Escuchando..." : "Asistente de voz"}</h2>
        <p className="mt-3 text-lg text-[#d0d4d9]">
          {isConnected
            ? "Hable claramente para obtener mejores resultados"
            : "Pulse conectar para activar el asistente de voz"}
        </p>
      </div>
  
      {/* Botón de conectar */}
      <Button
        size="lg"
        onClick={isConnected ? stopVoice : startVoice}
        className={cn(
          "px-10 py-6 text-xl font-semibold transition-colors duration-300 rounded-full focus:outline-none",
          isConnected
            ? "bg-[#e74c3c] hover:bg-[#c0392b] focus:ring-2 focus:ring-red-500"
            : "bg-[#2980b9] hover:bg-[#1f6fa6] focus:ring-2 focus:ring-blue-400"
        )}
      >
        {isConnected ? "Desconectar" : "Conectar"}
      </Button>
  
      {/* Elemento de audio para escuchar el flujo remoto */}
      <audio ref={audioRef} className="hidden" autoPlay />
    </div>
  );
  
  
}
