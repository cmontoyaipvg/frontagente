"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { v4 as uuidv4 } from "uuid"
import { toast } from "sonner"
import { ChatList } from "@/components/chat/chat-list"
import { ChatInput } from "@/components/chat/chat-input"
import { Sidebar } from "@/components/chat/sidebar"
import { Header } from "@/components/chat/header"
import { AgentInfoModal } from "@/components/chat/agent-info-modal"
import { VoiceMode } from "@/components/chat/voice-mode"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { buildMessageFormData } from "@/lib/chat-service"
import useAIChatStreamHandler from "@/hooks/useAIStreamHandler"
import useChatActions from "@/hooks/useChatActions"
import useSessionLoader from "@/hooks/useSessionLoader"
import { useQueryState } from 'nuqs'
import { usePlaygroundStore } from "@/src/app/store"
import type { Agent, SessionEntry } from "@/types/playground"
import { useAuth } from "@/context/auth-context"
import { deletePlaygroundSessionAPI } from "@/src/app/api/playground"
import { useTheme } from "@/components/theme-provider"
import Image from "next/image"

// Componente de Bienvenida unificado
// Componente de Bienvenida mejorado
const WelcomeScreen = ({ theme, isMobile }: { theme: string; isMobile: boolean }) => (
  <div className={`flex-1 flex items-center justify-center ${theme === "dark" ? "bg-[#212121]" : "bg-white"}`}>
    <div className="text-center max-w-md mx-auto px-4 animate-fade-in-scale">
      
      {/* Trilogia más grande con AI en color diferente */}
      <h1 className={cn(
        "font-bold",
        isMobile ? "text-3xl mb-3" : "text-5xl mb-4",
        "animate-fade-in-up animation-delay-400"
      )}>
        <span className="text-white">Trilog</span>
        <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">IA</span>
      </h1>
      
      {/* Bienvenido en blanco */}
      
      <p className={cn(
        theme === "dark" ? "text-gray-300" : "text-gray-600",
        isMobile ? "text-sm" : "text-base",
        "animate-fade-in-up animation-delay-400"
      )}>
        Selecciona un agente especializado y comienza tu experiencia con IA
      </p>
    </div>
  </div>
)

export default function ChatPage() {
  const [selectedSession, setSelectedSession] = useState<SessionEntry | null>(null)
  const [showAgentInfoModal, setShowAgentInfoModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false) 
  const [voiceModeActive, setVoiceModeActive] = useState(false)
  const [voiceConnected, setVoiceConnected] = useState(false)
  
  const initializedRef = useRef(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  const { user, logout } = useAuth()
  const { handleStreamResponse, stopStreaming, isStreaming } = useAIChatStreamHandler()
  const { initializePlayground, clearChat } = useChatActions()
  const { getSession, getSessions, cancelPendingRequest } = useSessionLoader()
  const isMobile = useMobile()
  const { theme } = useTheme()
  
  const messages = usePlaygroundStore((s) => s.messages)
  const agents = usePlaygroundStore((s) => s.agents) 
  const sessions = usePlaygroundStore((s) => s.sessionsData) || []
  const selectedAgentId = usePlaygroundStore((s) => s.selectedModel)
  const selectedEndpoint = usePlaygroundStore((s) => s.selectedEndpoint)
  const setSelectedModel = usePlaygroundStore((s) => s.setSelectedModel)
  
  const [sessionId, setSessionId] = useQueryState("session")
  const [agentId, setAgentId] = useQueryState("agent")

  const sidebarWidth = 260
  const collapsedSidebarWidth = 0

  // Inicialización
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      initializePlayground()
    }
  }, [initializePlayground])
  
  // Estado inicial del sidebar
  useEffect(() => {
    setSidebarOpen(!isMobile)
  }, [])

  // Cargar sesiones cuando se selecciona un agente
  useEffect(() => {
    if (selectedAgentId && user?.id) {
      getSessions(selectedAgentId)
    }
  }, [selectedAgentId, user?.id, getSessions])
  
  // Cargar sesión específica o crear nueva
  useEffect(() => {
    if (!user?.id || !selectedAgentId) return
    
    const loadSession = async () => {
      if (sessionId) {
        const session = sessions.find(s => s.session_id === sessionId)
        if (session) {
          await loadSessionWithMessages(session)
        }
      } else if (sessions.length > 0 && !selectedSession) {
        await loadSessionWithMessages(sessions[0])
      }
    }
    
    loadSession()
  }, [sessionId, selectedAgentId, user?.id, sessions])

  // Asegurar que hay un agente seleccionado
  useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedModel(agents[0].agent_id)
    }
  }, [agents, selectedAgentId, setSelectedModel])
  
  const loadSessionWithMessages = useCallback(async (session: SessionEntry) => {
    if (!user?.id || !selectedAgentId) return
    
    try {
      const messages = await getSession(session.session_id, selectedAgentId)
      if (messages) {
        setSelectedSession(session)
        setSessionId(session.session_id)
        
        if (isMobile) {
          setSidebarOpen(false)
        }
      }
    } catch (error) {
      console.error("Error al cargar sesión:", error)
      toast.error("No se pudo cargar la sesión")
    }
  }, [user?.id, selectedAgentId, getSession, setSessionId, isMobile])

  const handleNewSession = useCallback(() => {
    if (isStreaming) {
      stopStreaming()
    }
    
    const newSession: SessionEntry = {
      session_id: uuidv4(),
      title: `Nuevo Chat`,
      created_at: Date.now()
    }
  
    usePlaygroundStore.getState().setSessionsData(prev => [newSession, ...(prev ?? [])])
    setSelectedSession(newSession)
    clearChat()
    setSessionId(newSession.session_id)
    
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [isStreaming, stopStreaming, clearChat, setSessionId, isMobile])
  
  const handleSelectAgent = useCallback((agent: Agent) => {
    setSelectedModel(agent.agent_id)
    setAgentId(agent.agent_id)
  }, [setSelectedModel, setAgentId])
  
  const handleSelectSession = useCallback((session: SessionEntry) => {
    if (isStreaming) {
      stopStreaming()
    }
    cancelPendingRequest()
    loadSessionWithMessages(session)
  }, [isStreaming, stopStreaming, loadSessionWithMessages, cancelPendingRequest])

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    if (!selectedAgentId || !user?.id) return
  
    const success = await deletePlaygroundSessionAPI(
      selectedEndpoint,
      selectedAgentId,
      sessionId,
      user.id
    )
  
    if (success) {
      const updated = sessions.filter((s) => s.session_id !== sessionId)
      usePlaygroundStore.getState().setSessionsData(updated)
      
      if (selectedSession?.session_id === sessionId) {
        if (updated.length > 0) {
          loadSessionWithMessages(updated[0])
        } else {
          setSelectedSession(null)
          clearChat()
          setSessionId(null)
        }
      }
    } else {
      toast.error("No se pudo eliminar la sesión")
    }
  }, [selectedAgentId, user?.id, selectedEndpoint, sessions, selectedSession, loadSessionWithMessages, clearChat, setSessionId])

  const handleSendMessage = useCallback(async (content: string, files?: File[]) => {
    if (!selectedSession || !user) return
  
    const formData = buildMessageFormData(
      content, 
      user.id, 
      selectedSession.session_id, 
      files
    )
  
    try {
      await handleStreamResponse(formData)
    } catch (err) {
      console.error("Error al enviar mensaje:", err)
    }
  }, [selectedSession, user, handleStreamResponse])
  
  const handleCancelRequest = useCallback(() => {
    stopStreaming()
  }, [stopStreaming])
  
  const handleVoiceModeToggle = useCallback(() => {
    setVoiceModeActive(true)
  }, [])

  const handleVoiceConnect = useCallback(() => {
    setVoiceConnected(!voiceConnected)
  }, [voiceConnected])

  const handleVoiceModeClose = useCallback(() => {
    setVoiceConnected(false)
    setVoiceModeActive(false)
  }, [])
  
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  const selectedAgent = agents.find((a) => a.agent_id === selectedAgentId) ?? null
  
  const bgClass = theme === "dark" ? "bg-[#212121]" : "bg-gray-50"
  const textClass = theme === "dark" ? "text-white" : "text-gray-900"
  const contentBgClass = theme === "dark" ? "bg-[#212121]" : "bg-white"
  
  const gridTemplateColumns = isMobile
    ? sidebarOpen ? "100% 0%" : "0% 100%"
    : sidebarOpen ? `${sidebarWidth}px 1fr` : `${collapsedSidebarWidth}px 1fr`

  return (
    <div 
      className={`h-screen ${bgClass} ${textClass}`} 
      style={{
        display: 'grid',
        gridTemplateColumns,
        gridTemplateRows: 'auto 1fr',
        transition: 'grid-template-columns 300ms ease-in-out'
      }}
    >
      {/* Sidebar */}
      <div 
        style={{ 
          gridColumn: '1', 
          gridRow: '1', 
          zIndex: 20,
          display: sidebarOpen ? 'block' : 'none'
        }}
        className={cn(
          isMobile && sidebarOpen && "fixed inset-0 w-full h-full"
        )}
      >
        <Sidebar
  sessions={sessions}
  agents={agents}
  selectedSession={selectedSession}
  selectedAgent={selectedAgent}
  onSelectSession={handleSelectSession}
  onDeleteSession={handleDeleteSession}
  onNewSession={handleNewSession}
  onSelectAgent={handleSelectAgent}
  isOpen={sidebarOpen}
  onToggle={toggleSidebar}
  user={user}  // Añadir esta línea
  onLogout={logout}  // Añadir esta línea
/>
      </div>
      
      {/* Header */}
      <div 
        style={{ 
          gridColumn: '2', 
          gridRow: '1', 
          zIndex: 5,
          display: isMobile && sidebarOpen ? 'none' : 'block'
        }}
      >
        <Header
          user={user}
          selectedAgent={selectedAgent}
          onLogout={logout}
          onAgentInfo={() => setShowAgentInfoModal(true)}
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
          onNewSession={handleNewSession}
          agents={agents}
          onSelectAgent={handleSelectAgent}
          isMobile={isMobile}
        />
      </div>
      
      {/* Main Content Area */}
     {/* Main Content Area */}
<div 
  style={{ 
    gridColumn: '2', 
    gridRow: '2', 
    overflowY: 'hidden',
    display: isMobile && sidebarOpen ? 'none' : 'flex',
    flexDirection: 'column'
  }} 
  className={contentBgClass}
>
  {selectedSession ? (
    <div className="flex flex-col h-full relative">
     <div
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-auto ${contentBgClass}`}
      >
        <div className="flex flex-col min-h-full w-full max-w-3xl mx-auto pb-4">
          <ChatList
            messages={messages}
            onSendMessage={handleSendMessage}
            isStreaming={isStreaming}
            scrollContainerRef={scrollContainerRef}
          />
        </div>
      </div>

      <div className="w-full flex justify-center border-none">
        <div className={`w-full max-w-3xl border-none ${isMobile ? 'mx-2' : 'mb-0'}`}>
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isStreaming}
            onCancelRequest={handleCancelRequest}
            onVoiceModeToggle={handleVoiceModeToggle}
            isMobile={isMobile}
            agents={agents}
            selectedAgent={selectedAgent}
            onSelectAgent={handleSelectAgent}
          />
        </div>
      </div>
    </div>
  ) : (
    <WelcomeScreen theme={theme} isMobile={isMobile} />
  )}
</div>

      {/* Modales */}
      <AgentInfoModal
        agent={selectedAgent}
        isOpen={showAgentInfoModal}
        onClose={() => setShowAgentInfoModal(false)}
        isMobile={isMobile}
      />

      {voiceModeActive && (
        <VoiceMode 
          onClose={handleVoiceModeClose} 
          onConnect={handleVoiceConnect} 
          isConnected={voiceConnected}
          isMobile={isMobile}
        />
      )}
    </div>
  )
}