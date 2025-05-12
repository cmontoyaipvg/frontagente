"use client"

import { MessageCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import type { SessionEntry } from "@/types/playground"

interface SessionItemProps {
  session: SessionEntry
  isActive: boolean
  onClick: () => void
  onDelete: () => void
}

export function SessionItem({ session, isActive, onClick, onDelete }: SessionItemProps) {
  const { theme } = useTheme()

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer",
        "transition-colors duration-150",
        isActive
          ? theme === "dark"
            ? "bg-[#2a2e3b] text-white"
            : "bg-gray-200 text-gray-900"
          : theme === "dark"
            ? "text-gray-300 hover:bg-[#2a2e3b] hover:text-white"
            : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
      )}
    >
      {/* Icono del chat */}
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
        <MessageCircle className="h-3 w-3 text-white" />
      </div>
      
      {/* Título del chat */}
      <span className="truncate text-sm flex-1">
        {session.title}
      </span>
      
      {/* Botón de eliminar (opcional) */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          theme === "dark"
            ? "text-gray-400 hover:text-white hover:bg-[#333333]"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
        )}
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  )
}