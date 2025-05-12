'use client'

import { toast } from 'sonner'
import { APIRoutes } from './routes'
import type { ComboboxAgent, Agent, SessionEntry,SessionDetail } from '@/types/playground'

/**
 * Fetches and returns the list of agents allowed for the given user profile.
 * @param endpoint Base URL of the Playground API
 * @param userPerfil Perfil del usuario (e.g. 'admin', 'user', etc.)
 */
export async function getPlaygroundAgentsAPI(
  endpoint: string,
  userPerfil: string
): Promise<Agent[]> {
  const url = APIRoutes.GetPlaygroundAgents(endpoint)
  try {
    const res = await fetch(url)
    if (!res.ok) {
      toast.error(`Failed to fetch agents: ${res.statusText}`)
      return []
    }
    const data: Agent[] = await res.json()
    return data
      .map<Agent>((item) => ({
        agent_id: item.agent_id,
        name: item.name,
        description: item.description,
        model:  item.model,
        storage: item.storage ?? false,
        AudioRealTime: item.AudioRealTime ?? false
      }))
  } catch (err) {
    console.error(err)
    toast.error('Error fetching playground agents')
    return []
  }
}

/**
 * Retrieves the HTTP status of the Playground service.
 */
export async function getPlaygroundStatusAPI(
  endpoint: string
): Promise<number> {
  const response = await fetch(APIRoutes.PlaygroundStatus(endpoint))
  return response.status
}

/**
 * Fetches all sessions for a given agent and user.
 * @param endpoint Base API URL
 * @param agentId ID of the agent
 * @param userId ID of the current user
 */
export async function getAllPlaygroundSessionsAPI(
  endpoint: string,
  agentId: string,
  userId: string,
  options?: { signal?: AbortSignal }
): Promise<SessionEntry[]> {
  try {
    const response = await fetch(
      APIRoutes.GetPlaygroundSessions(endpoint, agentId, userId),
      { method: 'GET',signal: options?.signal }
    )
    if (!response.ok) {
      if (response.status === 404) return []
      throw new Error(`Failed to fetch sessions: ${response.statusText}`)
    }
    return response.json()
  } catch (err) {
    console.error('Error fetching sessions:', err)
    return []
  }
}

/**
 * Fetches a single session by ID.
 */
export async function getPlaygroundSessionAPI(
  base: string,
  agentId: string,
  sessionId: string,
  userId: string,
  options?: { signal?: AbortSignal }
): Promise<SessionDetail | null> {
  try {
    const res = await fetch(
      APIRoutes.GetPlaygroundSession(base, agentId, sessionId, userId),
      { method: 'GET',signal: options?.signal }
    )
    if (!res.ok) return null
    // Le decimos a TS que el JSON viene con la forma completa de SessionDetail
    const data = (await res.json()) as SessionDetail
    return data
  } catch {
    return null
  }
}

/**
 * Deletes a session.
 */
export async function deletePlaygroundSessionAPI(
  endpoint: string,
  agentId: string,
  sessionId: string,
  userId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      APIRoutes.DeletePlaygroundSession(endpoint, agentId, sessionId, userId),
      { method: 'DELETE' }
    )
    return response.ok
  } catch (err) {
    console.error('Error deleting session:', err)
    return false
  }
}
