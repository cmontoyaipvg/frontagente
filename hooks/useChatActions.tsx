'use client'
import { useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { usePlaygroundStore } from '@/src/app/store'
import {
  getPlaygroundAgentsAPI,
  getPlaygroundStatusAPI,
} from '@/src/app/api/playground'
import type { Agent } from '@/types/playground'
import { useQueryState } from 'nuqs'
import { useAuth } from '@/context/auth-context'
import type { PlaygroundChatMessage } from '@/types/playground'

const useChatActions = () => {
  // Referencia para rastrear si ya se ha inicializado
  const initializationDoneRef = useRef(false);
  
  // Usar selectores individuales para evitar el bucle infinito
  const chatInputRef = usePlaygroundStore((s) => s.chatInputRef)
  const selectedEndpoint = usePlaygroundStore((s) => s.selectedEndpoint)
  const setMessages = usePlaygroundStore((s) => s.setMessages)
  const setIsEndpointActive = usePlaygroundStore((s) => s.setIsEndpointActive)
  const setIsEndpointLoading = usePlaygroundStore((s) => s.setIsEndpointLoading)
  const setAgents = usePlaygroundStore((s) => s.setAgents)
  const setSelectedModel = usePlaygroundStore((s) => s.setSelectedModel)
  
  const { user } = useAuth()
  const [, setSessionId] = useQueryState('session')
  const [agentId, setAgentId] = useQueryState('agent')

  const getStatus = useCallback(async () => {
    try {
      return await getPlaygroundStatusAPI(selectedEndpoint)
    } catch {
      return 503
    }
  }, [selectedEndpoint])

  const getAgents = useCallback(async () => {
    if (!user?.perfil) {
      toast.error('No hay perfil de usuario')
      return []
    }
    try {
      return await getPlaygroundAgentsAPI(selectedEndpoint, user.perfil)
    } catch {
      toast.error('Error al obtener agentes')
      return []
    }
  }, [selectedEndpoint, user?.perfil])

  const initializePlayground = useCallback(async () => {
    // Evitar múltiples inicializaciones
    if (initializationDoneRef.current) {
      return;
    }
    
    setIsEndpointLoading(true)
    
    try {
      const status = await getStatus()
      if (status !== 200) {
        setIsEndpointActive(false)
        return
      }

      setIsEndpointActive(true)

      const agents: Agent[] = await getAgents()
      if (agents.length === 0) {
        return;
      }

      setAgents(agents)

      const currentAgentId = agentId || agents[0].agent_id
      if (!agentId) setAgentId(currentAgentId)
      setSelectedModel(currentAgentId)
      
      // Marcar como inicializado
      initializationDoneRef.current = true;
    
    } catch (err) {
      console.error(err)
    } finally {
      setIsEndpointLoading(false)
    }
  }, [getStatus, getAgents, setAgents, agentId, setAgentId, setSelectedModel, setIsEndpointActive, setIsEndpointLoading])

  
  const clearChat = useCallback(() => {
    setMessages([])
    setSessionId(null)
  }, [setMessages, setSessionId])

  const focusChatInput = useCallback(() => {
    setTimeout(() => requestAnimationFrame(() => chatInputRef?.current?.focus()), 0)
  }, [chatInputRef])

  const addMessage = useCallback(
    (msg: PlaygroundChatMessage) => {
      setMessages((prev) => [...prev, msg])
    },
    [setMessages]
  )

  return {
    clearChat,
    addMessage,
    getAgents,
    focusChatInput,
    initializePlayground
  }
}

export default useChatActions