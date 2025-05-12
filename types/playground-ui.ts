import type { PlaygroundChatMessage, Attachment } from "@/types/playground"

export interface UIChatMessage extends PlaygroundChatMessage {
  id: string
  attachments?: Attachment[]
}
