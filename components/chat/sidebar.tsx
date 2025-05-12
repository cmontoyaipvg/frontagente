"use client"
import { ChevronLeft, Plus, LogOut, MessageCircle, PenLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"
import { useTheme } from "@/components/theme-provider"
import { useRef } from "react"
import type { Agent, SessionEntry } from "@/types/playground"
import type { User as UserType } from "@/types/auth"
import { SidebarLeftIcon } from "../icons"
import { NewChatIcon } from "../ui/icon/custom-icons"
import { SessionItem } from "./session-item"

interface SidebarProps {
  sessions: SessionEntry[]
  agents: Agent[]
  selectedSession: SessionEntry | null
  selectedAgent: Agent | null
  onSelectSession: (session: SessionEntry) => void
  onDeleteSession: (sessionId: string) => void
  onNewSession: () => void
  onSelectAgent: (agent: Agent) => void
  isOpen: boolean
  onToggle: () => void
  user: UserType | null
  onLogout: () => void
}

export function Sidebar({
  sessions,
  agents,
  selectedSession,
  selectedAgent,
  onSelectSession,
  onDeleteSession,
  onNewSession,
  onSelectAgent,
  isOpen,
  onToggle,
  user,
  onLogout,
}: SidebarProps) {
  const isMobile = useMobile()
  const { theme } = useTheme()
  const isProcessingRef = useRef(false)

  const handleSelectSession = (session: SessionEntry) => {
    if (isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    
    onSelectSession(session);
    
    setTimeout(() => {
      if (isMobile) {
        onToggle();
      }
      isProcessingRef.current = false;
    }, 150);
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex h-full flex-col transition-all duration-300 ease-in-out",
        theme === "dark"
          ? "bg-[#1a1b1d]"
          : "bg-gray-100",
        isOpen ? "w-64" : "w-0 opacity-0 pointer-events-none"
      )}
    >
      <div className={cn("w-full h-full flex flex-col", !isOpen && isMobile && "hidden")}>
        {isOpen && (
          <>
            {/* Header con texto Trilogia y botón nuevo chat */}
            <div className="flex items-center justify-between p-4">
              <h2 className={cn(
                     "font-bold",
                     isMobile ? "text-2xl mb-3" : "text-3xl mb-4",
                     "animate-fade-in animation-delay-200"
                   )}>
                     <span className="text-white">Trilog</span>
                     <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">IA</span>
                   </h2>
              
                   <div className="flex items-center space-x-2">
  {/* Botón nuevo chat con SVG personalizado */}
  <Button
    onClick={onNewSession}
    variant="ghost"
    className={cn(

      "", // Aumentado de h-10 w-10 a h-12 w-12
      "rounded-md text-sm",
      "hover:bg-[#2a2e3b] focus:ring-0",
      theme === 'dark' 
        ? 'text-white' 
        : 'text-gray-700'
    )}
  >
    <svg
      width="24" // Aumentado de 24 a 28
      height="24" // Aumentado de 24 a 28
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-current"
      aria-hidden={true}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.7929 2.79289C18.0118 1.57394 19.9882 1.57394 21.2071 2.79289C22.4261 4.01184 22.4261 5.98815 21.2071 7.20711L12.7071 15.7071C12.5196 15.8946 12.2652 16 12 16H9C8.44772 16 8 15.5523 8 15V12C8 11.7348 8.10536 11.4804 8.29289 11.2929L16.7929 2.79289ZM19.7929 4.20711C19.355 3.7692 18.645 3.7692 18.2071 4.2071L10 12.4142V14H11.5858L19.7929 5.79289C20.2308 5.35499 20.2308 4.64501 19.7929 4.20711ZM6 5C5.44772 5 5 5.44771 5 6V18C5 18.5523 5.44772 19 6 19H18C18.5523 19 19 18.5523 19 18V14C19 13.4477 19.4477 13 20 13C20.5523 13 21 13.4477 21 14V18C21 19.6569 19.6569 21 18 21H6C4.34315 21 3 19.6569 3 18V6C3 4.34314 4.34315 3 6 3H10C10.5523 3 11 3.44771 11 4C11 4.55228 10.5523 5 10 5H6Z"
        fill="currentColor"
      />
    </svg>
  </Button>

  {/* Resto del código... */}
</div>
            </div>

            <Separator className={theme === "dark" ? "bg-[#252529]" : "bg-gray-200"} />

            {/* Lista de sesiones */}
            <div className="flex-1 overflow-hidden p-2">
              <ScrollArea className="h-full">
                <div className="space-y-1">
                  {sessions.length > 0 ? (
                    sessions.map((session) => (
                      <SessionItem
                        key={session.session_id}
                        session={session}
                        isActive={selectedSession?.session_id === session.session_id}
                        onClick={() => handleSelectSession(session)}
                        onDelete={() => onDeleteSession(session.session_id)}
                      />
                    ))
                  ) : (
                    <p className={cn(
                      "px-3 py-4 text-center text-sm",
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    )}>
                      No hay chats
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Sección de usuario al final */}
            <div className="mt-auto border-t border-gray-700">
              <div className="p-3">
                {user && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback
                          className={cn(
                            "bg-purple-600 text-white",
                            "text-sm font-medium"
                          )}
                        >
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className={cn(
                          "text-sm font-medium",
                          theme === "dark" ? "text-white" : "text-gray-900"
                        )}>
                          {user.name || "Usuario"}
                        </span>
                        <span className={cn(
                          "text-xs",
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        )}>
                          {user.email}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onLogout}
                      className={cn(
                        "h-8 w-8",
                        theme === "dark" 
                          ? "text-gray-400 hover:text-white hover:bg-[#2a2e3b]" 
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      )}
                      title="Cerrar sesión"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}