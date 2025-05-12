import { v4 as uuidv4 } from 'uuid'
import type { ChatEntry, PlaygroundChatMessage } from '@/types/playground'


export const adaptMessagesToUI = (
  messages: PlaygroundChatMessage[]
): PlaygroundChatMessage[] => {
  return messages.map((msg) => {
    let content = msg.content

    // Asegura que el content sea string si viene como objeto
    if (typeof content === 'object') {
      try {
        content = JSON.stringify(content, null, 2)
      } catch {
        content = "[Objeto no serializable]"
      }
    }

    return {
      ...msg,
      id: `${msg.role}-${msg.created_at}-${uuidv4()}`,
      content: content ?? "", // <- asegurar que no sea null
      attachments: 'attachments' in msg ? msg.attachments ?? [] : []
    }
  })
}

export const adaptChatEntryToPlaygroundMessage = (
  entries: PlaygroundChatMessage[]
): PlaygroundChatMessage[] => {
  return entries.flatMap((entry) => {
    const userMessage: PlaygroundChatMessage = {
      role: entry.role,
      content: entry.content,
      created_at: entry.created_at
    }

    const agentResponse: PlaygroundChatMessage = {
      role: "agent",
      content: entry.content,
      created_at: entry.created_at,
      tool_calls: entry.tool_calls,
      extra_data: entry.extra_data,
      images: entry.images,
      videos: entry.videos,
      audio: entry.audio,
      response_audio: entry.response_audio
    }

    return [userMessage, agentResponse]
  })
}
  
  
  
  