export interface ToolCall {
    role: 'user' | 'tool' | 'system' | 'assistant'
    content: string | null
    tool_call_id: string
    tool_name: string
    tool_args: Record<string, string>
    tool_call_error: boolean
    metrics: {
      time: number
    }
    created_at: number
  }
  
  export interface ReasoningSteps {
    title: string
    action?: string
    result: string
    reasoning: string
    confidence?: number
    next_action?: string
  }
  export interface ReasoningStepProps {
    index: number
    stepTitle: string
  }
  export interface ReasoningProps {
    reasoning: ReasoningSteps[]
  }
  
  export type ToolCallProps = {
    tools: ToolCall
  }
  interface ModelMessage {
    content: string | null
    context?: MessageContext[]
    created_at: number
    metrics?: {
      time: number
      prompt_tokens: number
      input_tokens: number
      completion_tokens: number
      output_tokens: number
    }
    name: string | null
    role: string
    tool_args?: unknown
    tool_call_id: string | null
    tool_calls: Array<{
      function: {
        arguments: string
        name: string
      }
      id: string
      type: string
    }> | null
  }
  
  export interface Model {
    name: string
    model: string
    provider: string
  }
  
  export interface Agent {
    agent_id: string
    name: string
    description: string
    model: Model
    storage?: boolean
    perfiles?:string[]
    AudioRealTime?: boolean
  }
  
  interface MessageContext {
    query: string
    docs?: Array<Record<string, object>>
    time?: number
  }
  
  export enum RunEvent {
    RunStarted = 'RunStarted',
    RunResponse = 'RunResponse',
    RunCompleted = 'RunCompleted',
    ToolCallStarted = 'ToolCallStarted',
    ToolCallCompleted = 'ToolCallCompleted',
    UpdatingMemory = 'UpdatingMemory',
    ReasoningStarted = 'ReasoningStarted',
    ReasoningStep = 'ReasoningStep',
    ReasoningCompleted = 'ReasoningCompleted',
    RunError = 'RunError'
  }
  export interface ResponseAudio {
    id?: string
    content?: string
    transcript?: string
    channels?: number
    sample_rate?: number
  }
  export interface RunResponse {
    content?: string | object
    content_type: string
    context?: MessageContext[]
    event: RunEvent
    event_data?: object
    messages?: ModelMessage[]
    metrics?: object
    model?: string
    run_id?: string
    agent_id?: string
    session_id?: string
    created_at: number
    tools?: ToolCall[]
    extra_data?: PlaygroundAgentExtraData
    images?: ImageData[]
    videos?: VideoData[]
    audio?: AudioData[]
    response_audio?: ResponseAudio
  }
  
  export interface AgentExtraData {
    reasoning_steps?: ReasoningSteps[]
    reasoning_messages?: ReasoningMessage[]
    references?: ReferenceData[]
  }
  
  export interface PlaygroundAgentExtraData extends AgentExtraData {
    reasoning_messages?: ReasoningMessage[]
    references?: ReferenceData[]
  }
  
  export interface ReasoningMessage {
    role: 'user' | 'tool' | 'system' | 'assistant'
    content: string | null
    tool_call_id?: string
    tool_name?: string
    tool_args?: Record<string, string>
    tool_call_error?: boolean
    metrics?: {
      time: number
    }
    created_at?: number
  }
  export type ArtifactKind = 'text' | 'code' | 'image' | 'sheet' | 'mermaid' | 'voice'| 'products';
  
  export interface UIArtifact {
    title: string;
    documentId: string;
    kind: ArtifactKind;
    content: string;
    isVisible: boolean;
    status: 'idle' | 'streaming' | 'error';
    boundingBox: {
      top: number;
      left: number;
      width: number;
      height: number;
    };
    skuList?: string[]; // Añadido para el artefacto de productos
  }
  export interface PlaygroundChatMessage {
    role: 'user' | 'agent' | 'system' | 'tool'
    content: string
    streamingError?: boolean
    created_at: number
    tool_calls?: ToolCall[]
    extra_data?: {
      reasoning_steps?: ReasoningSteps[]
      reasoning_messages?: ReasoningMessage[]
      references?: ReferenceData[]
    }
    images?: ImageData[]
    videos?: VideoData[]
    audio?: AudioData[]
    response_audio?: ResponseAudio
  }
  export interface Attachment {
    name: string
    type: string
    url: string
    size: number
  }
  export interface ComboboxAgent {
    value: string
    label: string
    description: string
    model: Model
    storage?: boolean
    AudioRealTime: boolean
  }
  export interface ImageData {
    revised_prompt: string
    url: string
  }
  
  export interface VideoData {
    id: number
    eta: number
    url: string
  }
  // En types/product.ts
  
  export interface ProductData {
    sku: string;
    nombre: string;
    marca?: string;
    descripcion?: string;
    categoria_uen?: string;
    linea?: string;
    partNumber?: string;
    precio: number;
    precios_escala?: {
      desde: number;
      hasta?: number;
      precio: number;
    }[];
    imagen_450?: string[];
    atributos?: {
      [key: string]: string;
    };
  }
  export interface ProductArtifactData extends UIArtifact {
    kind: 'products';
    skuList: string[];
    productData?: ProductData[]; // Para almacenar los resultados
  }
  export interface AudioData {
    base64_audio?: string
    mime_type?: string
    url?: string
    id?: string
    content?: string
    channels?: number
    sample_rate?: number
  }
  
  export interface ReferenceData {
    query: string
    references: Reference[]
    time?: number
  }
  
  export interface Reference {
    content: string
    meta_data: {
      chunk: number
      chunk_size: number
    }
    name: string
  }
  
  export interface SessionEntry {
    session_id: string
    title: string
    created_at: number
  }
  export interface SessionDetail {
    session_id: string
    agent_id: string
    user_id: string | null
    memory: {
      runs?: ChatEntry[]
      chats?: ChatEntry[]
    }    
    agent_data: Record<string, unknown>
  }
  export interface ChatEntry {
    message: {
      role: 'user' | 'system' | 'tool' | 'assistant'
      content: string
      created_at: number
    }
    response: {
      content: string
      tools?: ToolCall[]
      extra_data?: {
        reasoning_steps?: ReasoningSteps[]
        reasoning_messages?: ReasoningMessage[]
        references?: ReferenceData[]
      }
      images?: ImageData[]
      videos?: VideoData[]
      audio?: AudioData[]
      response_audio?: {
        transcript?: string
      }
      created_at: number
    }
  }
  