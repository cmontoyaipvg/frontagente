"use client"

import { LogOut, Plus, User, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SidebarLeftIcon } from '@/components/ui/icon/custom-icons';
import type { User as UserType } from "@/types/auth"
import type { Agent } from "@/types/playground"
import { useMobile } from "@/hooks/use-mobile"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "@/components/theme-provider"
import { AgentSelector } from "./agent-selector"
import { cn } from "@/lib/utils"

interface HeaderProps {
  user: UserType | null
  selectedAgent: Agent | null
  onLogout: () => void
  onAgentInfo: () => void
  onToggleSidebar: () => void
  sidebarOpen: boolean
  onNewSession: () => void
  agents: Agent[]
  onSelectAgent: (agent: Agent) => void
  isMobile?: boolean
}

export function Header({
  user,
  selectedAgent,
  onLogout,
  onAgentInfo,
  onToggleSidebar,
  sidebarOpen,
  onNewSession,
  agents,
  onSelectAgent,
  isMobile: propIsMobile
}: HeaderProps) {
  const isMobileDetected = useMobile()
  const isMobile = propIsMobile !== undefined ? propIsMobile : isMobileDetected
  const { theme } = useTheme()

  const handleMenuClick = () => {
    console.log("Menu button clicked in Header");
    if (typeof onToggleSidebar === 'function') {
      onToggleSidebar();
    } else {
      console.error("onToggleSidebar is not a function");
    }
  };

  return (
    <header className={cn(
      "flex items-center justify-between px-2 py-2",
      theme === 'dark'
        ? 'bg-[#212121] text-white border-b border-[#2c2d31]'
        : 'bg-white text-gray-900 border-b border-gray-100',
      "w-full transition-all duration-300 h-14"
    )}>
      <div className="w-full grid grid-cols-2 items-center">
        {/* Panel izquierdo - Solo menú y botón nuevo chat */}
        <div className="flex items-center space-x-2">
          {/* Botón de menú */}
          <Button
            variant="ghost"
            onClick={handleMenuClick}
            className={cn(
              "p-3 h-12",
              "hover:bg-transparent focus:ring-0",
              theme === 'dark' 
                ? 'text-white' 
                : 'text-gray-700'
            )}
            aria-label="Menú"
            data-testid="sidebar-toggle"
          >
            <SidebarLeftIcon size={24} />
          </Button>

          {/* Botón de nuevo chat (solo en móvil) */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                console.log("New session button clicked");
                onNewSession();
              }}
              className={cn(
                "h-7 w-7 rounded-full flex-shrink-0",
                theme === 'dark' ? 'text-gray-800 hover:text-white bg-[#0c9279] hover:bg-[#2a2e3b]' : 'text-gray-100 font-bold hover:text-white bg-[#0063b9] hover:bg-[#2a2e3b]'
              )}
              aria-label="Nuevo chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Panel derecho - Vacío */}
        <div className="flex items-center justify-end gap-1 sm:gap-1">
          {/* Espacio vacío por ahora */}
        </div>
      </div>
    </header>
  )
}