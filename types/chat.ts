export interface Attachment {
  name: string
  type: string
  url: string
  size: number
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
  attachments?: Attachment[]
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  lastUpdated: Date
}

export interface Agent {
  id: string
  name: string
  description: string
  provider: string
  details?: string
}
