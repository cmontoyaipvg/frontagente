'use client'

import { useCallback, useRef, useEffect } from 'react'
import {
  getPlaygroundSessionAPI,
  getAllPlaygroundSessionsAPI
} from '@/src/app/api/playground'
import { usePlaygroundStore } from '@/src/app/store'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
import {
  PlaygroundChatMessage,
  ToolCall,
  ReasoningMessage,
  ChatEntry,
  SessionEntry,
  SessionDetail
} from '@/types/playground'

const useSessionLoader = () => {
  const setMessages = usePlaygroundStore((s) => s.setMessages)
  const selectedEndpoint = usePlaygroundStore((s) => s.selectedEndpoint)
  const setIsSessionsLoading = usePlaygroundStore((s) => s.setIsSessionsLoading)
  const setSessionsData = usePlaygroundStore((s) => s.setSessionsData)
  const { user } = useAuth()
  const abortControllerRef = useRef<AbortController | null>(null)
  const requestCache = useRef<Map<string, Promise<any>>>(new Map())
  
  const cancelPendingRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const getSessions = useCallback(
    async (agentId: string) => {
      if (!agentId || !selectedEndpoint || !user?.id) return
      
      const cacheKey = `sessions-${agentId}-${user.id}`
      
      if (requestCache.current.has(cacheKey)) {
        return requestCache.current.get(cacheKey)
      }
      
      try {
        setIsSessionsLoading(true)
        
        const sessionPromise = (async () => {
          try {
            const sessions: SessionEntry[] = await getAllPlaygroundSessionsAPI(
              selectedEndpoint,
              agentId,
              user.id
            )
            setSessionsData(sessions)
            return sessions
          } finally {
            setTimeout(() => {
              requestCache.current.delete(cacheKey)
            }, 1000)
            setIsSessionsLoading(false)
          }
        })()
        
        requestCache.current.set(cacheKey, sessionPromise)
        
        return sessionPromise
      } catch (err) {
        toast.error('Error loading sessions')
        setIsSessionsLoading(false)
        requestCache.current.delete(cacheKey)
        return []
      }
    },
    [selectedEndpoint, user?.id, setSessionsData, setIsSessionsLoading]
  )

  const getSession = useCallback(
    async (sessionId: string, agentId: string) => {
      if (!sessionId || !agentId || !selectedEndpoint || !user?.id) return null
      
      cancelPendingRequest()
      
      const cacheKey = `session-${agentId}-${sessionId}-${user.id}`
      
      if (requestCache.current.has(cacheKey)) {
        return requestCache.current.get(cacheKey)
      }
      
      const controller = new AbortController()
      abortControllerRef.current = controller
      
      const sessionPromise = (async () => {
        try {
          const session: SessionDetail | null = await getPlaygroundSessionAPI(
            selectedEndpoint,
            agentId,
            sessionId,
            user?.id,
            { signal: controller.signal }
          )
          
          if (controller.signal.aborted) {
            return null
          }
          
          if (!session?.memory) return null

          const history = session.memory.runs ?? session.memory.chats ?? []

          const messagesForPlayground: PlaygroundChatMessage[] = history.flatMap((run) => {
            const msgs: PlaygroundChatMessage[] = []
            if (run.message) {
              msgs.push({
                role: 'user',
                content: run.message.content ?? '',
                created_at: run.message.created_at
              })
            }
            if (run.response) {
              const toolCalls: ToolCall[] = [
                ...(run.response.tools ?? []),
                ...((run.response.extra_data?.reasoning_messages as ReasoningMessage[]) || [])
                  .filter((m) => m.role === 'tool')
                  .map((m) => ({
                    role: m.role,
                    content: m.content!,
                    tool_call_id: m.tool_call_id || '',
                    tool_name: m.tool_name || '',
                    tool_args: m.tool_args || {},
                    tool_call_error: m.tool_call_error || false,
                    metrics: m.metrics || { time: 0 },
                    created_at: m.created_at || Date.now()
                  }))
              ]
              msgs.push({
                role: 'agent',
                content: (run.response.content as string) ?? '',
                tool_calls: toolCalls.length ? toolCalls : undefined,
                extra_data: run.response.extra_data,
                images: run.response.images,
                videos: run.response.videos,
                audio: run.response.audio,
                response_audio: run.response.response_audio,
                created_at: run.response.created_at
              })
            }
            return msgs
          })

          const processed = messagesForPlayground.map((m) =>
            Array.isArray(m.content)
              ? {
                  ...m,
                  content: m.content
                    .filter((c: any) => c.type === 'text')
                    .map((c: any) => c.text)
                    .join(' ')
                }
              : m
          )

          setMessages(processed)
          return processed
        } catch (err: unknown) {
          if (
            typeof err === 'object' &&
            err !== null &&
            'name' in err &&
            (err as { name: string }).name === 'AbortError'
          ) {
            return null;
          }
          console.error('Error fetching session:', err)
          return null
        } finally {
          setTimeout(() => {
            requestCache.current.delete(cacheKey)
          }, 300)
        }
      })()
      
      requestCache.current.set(cacheKey, sessionPromise)
      
      return sessionPromise
    },
    [selectedEndpoint, user?.id, setMessages, cancelPendingRequest]
  )
  
  useEffect(() => {
    return () => {
      cancelPendingRequest()
      requestCache.current.clear()
    }
  }, [cancelPendingRequest]) 
  
  return { getSessions, getSession, cancelPendingRequest }
}

export default useSessionLoader