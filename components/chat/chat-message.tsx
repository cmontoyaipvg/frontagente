"use client"

import type { PlaygroundChatMessage } from "@/types/playground"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { format } from "date-fns"
import { FileIcon, FileTextIcon, FileArchiveIcon } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import type { Components } from "react-markdown"
import { SuggestionsRenderer } from "./suggestions-renderer"
import { OptionsRenderer } from "./options-renderer"
import { useState, useEffect, useRef, useCallback } from "react"
import { MessageActions } from "./message-actions"
import { TypingIndicator } from "./typing-indicator"
import Image from "next/image"
import { useTheme } from "@/components/theme-provider"
import { useMobile } from "@/hooks/use-mobile"
import Link from "next/link"
import { ChartRenderer } from "./chart-renderer"

// Hook para obtener dimensiones de la ventana
function useWindowSize() {
  const [windowSize, setWindowSize] = useState<{
    width: number | undefined;
    height: number | undefined;
  }>({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Inicializar al montar
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

// Ajustar tamaños según dispositivo
const getHeadingSizes = (isMobile: boolean) => ({
  1: isMobile ? "text-2xl font-bold" : "text-3xl font-bold",
  2: isMobile ? "text-xl font-bold" : "text-2xl font-bold",
  3: isMobile ? "text-lg font-bold" : "text-xl font-bold"
})

const getParagraphSizes = (isMobile: boolean) => ({
  body: isMobile ? "text-sm" : "text-md",
  lead: isMobile ? "text-sm font-medium" : "text-base font-medium",
  title: isMobile ? "text-sm font-medium" : "text-md font-medium"
})

interface ChatMessageProps {
  message: PlaygroundChatMessage
  onSendMessage: (message: string) => void
  isStreaming?: boolean
  onMermaidRender?: () => void
  isMobile?: boolean
  isLastBotMessage?: boolean 
}

export function ChatMessage({ 
  message, 
  onSendMessage, 
  isStreaming = false, 
  onMermaidRender,
  isMobile = false,
  isLastBotMessage = false
}: ChatMessageProps) {
  const isUser = message.role === "user"
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [options, setOptions] = useState<string[]>([])
  const [processedContent, setProcessedContent] = useState(message.content)
  const [isContentStreaming, setIsContentStreaming] = useState(false)
  const prevContentRef = useRef(message.content)
  const messageRef = useRef<HTMLDivElement>(null)
  const prevHeight = useRef<number>(0)

  const pendingContentUpdates = useRef<string | null>(null)
  const contentUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { theme } = useTheme()
  const windowSize = useWindowSize()
  
  // Tamaños adaptados según el dispositivo
  const HEADING_SIZES = getHeadingSizes(isMobile)
  const PARAGRAPH_SIZES = getParagraphSizes(isMobile)

  // Función para procesar actualizaciones de contenido con throttling
  const updateContentWithThrottling = useCallback((newContent: string) => {
    // Almacenar la actualización más reciente
    pendingContentUpdates.current = newContent;
    
    // Si ya hay un timeout programado, no hacer nada más
    if (contentUpdateTimeoutRef.current) return;
    
    // Programar actualización de contenido
    contentUpdateTimeoutRef.current = setTimeout(() => {
      // Aplicar la actualización más reciente
      if (pendingContentUpdates.current !== null) {
        setProcessedContent(pendingContentUpdates.current);
      }
      pendingContentUpdates.current = null;
      contentUpdateTimeoutRef.current = null;
    }, isMobile ? 30 : 20); // Throttling más largo en móvil para mejor rendimiento
  }, [isMobile]);

  // Detectar si está en streaming
  useEffect(() => {
    if (prevContentRef.current !== message.content) {
      setIsContentStreaming(true)
      
      // Actualizar contenido con throttling para reducir reflows
      updateContentWithThrottling(message.content);
      
      const timer = setTimeout(() => {
        if (message.content === prevContentRef.current) {
          setIsContentStreaming(false)
        }
        prevContentRef.current = message.content
      }, isMobile ? 500 : 300);

      
      return () => clearTimeout(timer)
    }
  }, [message.content, updateContentWithThrottling, isMobile])

  // Observar cambios de tamaño para minimizar saltos
  useEffect(() => {
    if (!isStreaming || !messageRef.current) return;
    
    // Guardar posición inicial de scroll
    const scrollContainer = document.querySelector('.messages-container') as HTMLElement;
    const initialScrollTop = scrollContainer?.scrollTop || 0;
    const initialScrollHeight = scrollContainer?.scrollHeight || 0;
    const clientHeight = scrollContainer?.clientHeight || 0;
    const isNearBottom = initialScrollHeight - initialScrollTop - clientHeight < (isMobile ? 100 : 150);
    
    // Usar ResizeObserver para detectar cambios de tamaño sin causar reflow
    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      
      const currentHeight = entry.contentRect.height;
      
      // Solo considerar cambios significativos (> 20px)
      if (Math.abs(currentHeight - prevHeight.current) > 20) {
        // Calcular la diferencia de altura
        const heightDifference = currentHeight - prevHeight.current;
        
        // Actualizar altura previa para futuras comparaciones
        prevHeight.current = currentHeight;
        
        // Si hay un contenedor de scroll y el usuario estaba cerca del fondo
        if (scrollContainer && isNearBottom) {
          // Desactivar temporalmente transiciones suaves para evitar saltos
          scrollContainer.style.scrollBehavior = 'auto';
          
          // Usar requestAnimationFrame para asegurar que se ejecuta después del reflow
          requestAnimationFrame(() => {
            // Scroll al fondo si estábamos cerca del mismo
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
            
            // Restaurar comportamiento de scroll después de un breve retraso
            setTimeout(() => {
              scrollContainer.style.scrollBehavior = '';
            }, 50);
          });
        } else if (scrollContainer && !isNearBottom) {
          // Si no estamos cerca del fondo, intentar mantener la posición relativa
          // Esto es especialmente importante para cambios de tamaño en elementos que ya están visibles
          
          // Desactivar temporalmente transiciones suaves
          scrollContainer.style.scrollBehavior = 'auto';
          
          requestAnimationFrame(() => {
            // Ajustar la posición si el cambio ocurrió por encima de la vista actual
            if (messageRef.current) {
              const rect = messageRef.current.getBoundingClientRect();
              const isAboveViewport = rect.bottom < 0;
              
              if (isAboveViewport) {
                // Si el elemento está por encima del viewport, ajustar la posición
                // para compensar el cambio de tamaño
                scrollContainer.scrollTop = initialScrollTop + heightDifference;
              }
            }
            
            // Restaurar comportamiento de scroll
            setTimeout(() => {
              scrollContainer.style.scrollBehavior = '';
            }, 50);
          });
        }
      }
    });
    
    resizeObserver.observe(messageRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [isStreaming, isMobile]);

  // Procesar el contenido para extraer sugerencias y opciones
  useEffect(() => {

    if (!isUser) {
      let content = message.content

      // Extraer sugerencias
      const suggestionsMatch = content.match(/<sugerencias>([\s\S]*?)<\/sugerencias>/i)
      if (suggestionsMatch) {
        const suggestionsText = suggestionsMatch[1].trim()
        const extractedSuggestions = suggestionsText
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)

        setSuggestions(extractedSuggestions)
        content = content.replace(/<sugerencias>[\s\S]*?<\/sugerencias>/i, "")
      } else {
        setSuggestions([])
      }

      // Extraer opciones
      const optionsMatch = content.match(/<opciones>([\s\S]*?)<\/opciones>/i)
      if (optionsMatch) {
        const optionsText = optionsMatch[1].trim()
        const extractedOptions = optionsText
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)

        setOptions(extractedOptions)
        content = content.replace(/<opciones>[\s\S]*?<\/opciones>/i, "")
      } else {
        setOptions([])
      }

      // Si no está en streaming, actualizar normalmente
      if (!isContentStreaming) {
        try {
          const safeContent = typeof content === "string" ? content : JSON.stringify(content, null, 2)
          setProcessedContent(safeContent.trim())
        } catch {
          setProcessedContent("[contenido no renderizable]")
        }
      }
      // Si está en streaming, usamos el throttling para evitar demasiadas actualizaciones
    } else {
      setProcessedContent(message.content)
      setSuggestions([])
      setOptions([])
    }
  }, [message.content, isUser, isContentStreaming])

  const renderAttachment = (attachment: any) => {
    const fileType = attachment.type?.split("/")[0]

    if (fileType === "image") {
      return (
        <div className={`mt-2 overflow-hidden rounded-md border ${
          theme === "dark" ? "border-[#2e3348]" : "border-gray-200"
        }`}>
          <img
            src={attachment.url || "/placeholder.svg"}
            alt={attachment.name}
            className={`${isMobile ? 'max-h-[160px]' : 'max-h-[200px]'} w-auto object-contain`}
          />
        </div>
      )
    }

    let Icon = FileIcon
    if (attachment.type?.includes("pdf") || attachment.type?.includes("text")) {
      Icon = FileTextIcon
    } else if (attachment.type?.includes("zip") || attachment.type?.includes("archive")) {
      Icon = FileArchiveIcon
    }

    return (
      <a 
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-2 flex items-center gap-2 rounded-md border ${isMobile ? 'p-1.5' : 'p-2'} ${
          theme === "dark" 
            ? "border-[#2e3348] hover:bg-[#2a2e3b]" 
            : "border-gray-200 hover:bg-gray-100"
        }`}
      >
        <Icon className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
        <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>{attachment.name}</span>
      </a>
    )
  }

  // Función para verificar si un bloque de código Mermaid está completo
  const isMermaidBlockComplete = (codeContent: string) => {
    const cleanContent = codeContent.trim()
    
    // Verificaciones básicas según el tipo de diagrama
    if (cleanContent.includes("pie")) {
      return cleanContent.includes(":") && /\d+(\.\d+)?/.test(cleanContent)
    }
    
    if (cleanContent.includes("xychart")) {
      return cleanContent.includes("[") && cleanContent.includes("]")
    }
    
    // Verificación general para cualquier tipo de diagrama
    const lines = cleanContent.split('\n').filter(line => line.trim().length > 0)
    return lines.length >= 3
  }

  // Verificar si hay bloques de Mermaid completos en el contenido
  const hasCompleteMermaidBlocks = (content: string) => {
    if (!content.includes("```mermaid")) return true
    
    // Dividir el contenido por bloques de mermaid
    const blocks = content.split("```mermaid")
    // El primer elemento es lo que viene antes del primer bloque mermaid, lo ignoramos
    blocks.shift()
    
    // Verificar que cada bloque mermaid tenga un cierre
    return blocks.every(block => block.includes("```"))
  }

  const hasCompleteChartjsonBlocks = (content: string): boolean => {
    if (!content.includes("```chartjson")) return true
    const regex = /```chartjson[\s\S]*?```/g
    const matches = content.match(regex)
    const startCount = (content.match(/```chartjson/g) || []).length
    const endCount = (content.match(/```/g) || []).length
    return matches?.length === startCount && startCount === endCount / 2
  }

  const extractChartjsonBlocks = (text: string) => {
    const regex = /```chartjson[\s\S]*?```/g
    const matches = text.match(regex) || []
    return matches.map(block => {
      // Limpiar el código antes de intentar parsearlo
      const jsonText = block
        .replace(/```chartjson/, "")
        .replace(/```$/, "")
        .trim()
      
      try {
        return {
          ...JSON.parse(jsonText),
          // Agregar isStreaming para control de renderizado
          isStreaming: isContentStreaming
        }
      } catch (error) {
        return null
      }
    }).filter(Boolean)
  }

  const chartjsonBlocks = !isUser && hasCompleteChartjsonBlocks(processedContent)
    ? extractChartjsonBlocks(processedContent)
    : []
  
  // Definir los componentes de Markdown con estilos mejorados y adaptados para móvil
  const markdownComponents: Components = {
    p: ({ children, className, ...props }) => (
      <p className={cn(PARAGRAPH_SIZES.body, "mb-2 last:mb-0", className)} {...props}>
        {children}
      </p>
    ),
    a: ({ href, children, className, ...props }) => (
      <a 
        href={href} 
        className={cn(
          "cursor-pointer underline", 
          theme === "dark" ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700",
          className
        )}
        target="_blank" 
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
    ul: ({ children, className, ...props }) => (
      <ul className={cn(
        "list-disc flex flex-col", 
        isMobile ? "pl-4 mb-1.5" : "pl-5 mb-2", 
        PARAGRAPH_SIZES.body, 
        className
      )} {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, className, ...props }) => (
      <ol className={cn(
        "list-decimal flex flex-col", 
        isMobile ? "pl-4 mb-1.5" : "pl-5 mb-2", 
        PARAGRAPH_SIZES.body, 
        className
      )} {...props}>
        {children}
      </ol>
    ),
    li: ({ children, className, ...props }) => (
      <li className={cn(isMobile ? "mb-0.5" : "mb-1", className)} {...props}>{children}</li>
    ),
    h1: ({ children, className, ...props }) => (
      <h1 className={cn(HEADING_SIZES[1], isMobile ? "mb-1.5 mt-2" : "mb-2 mt-3", className)} {...props}>{children}</h1>
    ),
    h2: ({ children, className, ...props }) => (
      <h2 className={cn(HEADING_SIZES[2], isMobile ? "mb-1.5 mt-2" : "mb-2 mt-3", className)} {...props}>{children}</h2>
    ),
    h3: ({ children, className, ...props }) => (
      <h3 className={cn(HEADING_SIZES[3], isMobile ? "mb-1.5 mt-2" : "mb-2 mt-3", className)} {...props}>{children}</h3>
    ),
    h4: ({ children, className, ...props }) => (
      <h4 className={cn(PARAGRAPH_SIZES.lead, "font-bold", isMobile ? "mb-1.5 mt-2" : "mb-2 mt-3", className)} {...props}>{children}</h4>
    ),
    h5: ({ children, className, ...props }) => (
      <h5 className={cn(PARAGRAPH_SIZES.title, "font-semibold", isMobile ? "mb-1.5 mt-2" : "mb-2 mt-3", className)} {...props}>{children}</h5>
    ),
    h6: ({ children, className, ...props }) => (
      <h6 className={cn(PARAGRAPH_SIZES.title, isMobile ? "mb-1.5 mt-2" : "mb-2 mt-3", className)} {...props}>{children}</h6>
    ),
    em: ({ children, className, ...props }) => (
      <em className={cn(isMobile ? "text-xs font-semibold" : "text-sm font-semibold", className)} {...props}>{children}</em>
    ),
    i: ({ children, className, ...props }) => (
      <i className={cn("italic", PARAGRAPH_SIZES.body, className)} {...props}>{children}</i>
    ),
    strong: ({ children, className, ...props }) => (
      <strong className={cn(isMobile ? "text-xs font-semibold" : "text-sm font-semibold", className)} {...props}>{children}</strong>
    ),
    b: ({ children, className, ...props }) => (
      <b className={cn(isMobile ? "text-xs font-semibold" : "text-sm font-semibold", className)} {...props}>{children}</b>
    ),
    u: ({ children, className, ...props }) => (
      <u className={cn("underline", PARAGRAPH_SIZES.body, className)} {...props}>{children}</u>
    ),
    del: ({ children, className, ...props }) => (
      <del 
        className={cn(
          "line-through", 
          PARAGRAPH_SIZES.body, 
          theme === "dark" ? "text-gray-400" : "text-gray-500",
          className
        )} 
        {...props}
      >
        {children}
      </del>
    ),
    hr: ({ className, ...props }) => (
      <hr 
        className={cn(
          "mx-auto border-b", 
          isMobile ? "my-3 w-36" : "my-4 w-48",
          theme === "dark" ? "border-gray-600" : "border-gray-300",
          className
        )} 
        {...props} 
      />
    ),
    blockquote: ({ children, className, ...props }) => (
      <blockquote 
        className={cn(
          "border-l-4 italic", 
          isMobile ? "pl-3 my-1.5" : "pl-4 my-2",
          PARAGRAPH_SIZES.body,
          theme === "dark" ? "border-gray-500 text-gray-300" : "border-gray-300 text-gray-600",
          className
        )} 
        {...props}
      >
        {children}
      </blockquote>
    ),
    code: ({ className, children, node, ...props }) => {
      // Verificar si es un código en línea o un bloque de código
      const match = /language-(\w+)/.exec(className || "")
      const isInline = !match && (props as any).inline
    

      // Manejar bloques chartjson
      if (match && match[1] === "chartjson") {
        const codeContent = String(children).replace(/\n$/, "")
        const chartJsonComplete = hasCompleteChartjsonBlocks(processedContent)
        
        if (isContentStreaming && !chartJsonComplete) {
          return (
            <div className={cn(
              "chart-container rounded-lg overflow-hidden shadow-md",
              isMobile ? "p-2 text-xs" : "p-3 text-sm"
            )}  style={{
              minHeight: `400px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              contain: 'strict'         // Más aislamiento para prevenir reflows
            } }>
              <div className="animate-pulse flex space-x-2 justify-center items-center">
                  <div className={`${isMobile ? 'h-1.5 w-1.5' : 'h-2 w-2'} bg-orange-600 rounded-full`}></div>
                  <div className={`${isMobile ? 'h-1.5 w-1.5' : 'h-2 w-2'} bg-orange-600 rounded-full`}></div>
                  <div className={`${isMobile ? 'h-1.5 w-1.5' : 'h-2 w-2'} bg-orange-600 rounded-full`}></div>
                </div>
            </div>
          )
        }
        
        try {
          const chartData = JSON.parse(codeContent);
          // Usar una key única para cada gráfico basada en su contenido y timestamp
          // Esto evita re-renders innecesarios que podrían causar saltos
          const uniqueKey = `chart-${codeContent.substring(0, 20).replace(/\s+/g, '')}-${Date.now()}`;
          
          // Función para notificar al padre sobre el renderizado del gráfico
          const handleChartRendered = () => {
            if (typeof onMermaidRender === 'function') {
              // Usar el mismo callback que Mermaid para ambos tipos de contenido especial
              onMermaidRender();
            }
          };
          
          return (
            <div className="chart-container-wrapper">
              <ChartRenderer 
                key={uniqueKey} 
                data={chartData} 
                isMobile={isMobile}
                isStreaming={isContentStreaming}
                onChartRendered={handleChartRendered}
              />
            </div>
          )
        } catch (error) {
          return (
            <div className={cn(
              "border rounded-md",
              isMobile ? "p-2 text-xs" : "p-3 text-sm",
              theme === "dark" 
                ? "bg-blue-900/30 border-blue-700 text-blue-300" 
                : "bg-blue-100 border-blue-300 text-blue-800"
            )}>
              <p className="font-bold">Cargando datos del gráfico</p>
            </div>
          )
        }
      }
    
      return isInline ? (
        <code 
          className={cn(
            "relative whitespace-pre-wrap rounded-sm",
            isMobile ? "px-0.5 py-0 text-[10px]" : "px-1 py-0.5 text-xs",
            theme === "dark" ? "bg-[#2a2e3b]" : "bg-gray-100"
          )}
          {...props}
        >
          {children}
        </code>
      ) : (
        <code 
          className={cn(
            "block rounded-md overflow-x-auto whitespace-pre",
            isMobile ? "p-1.5 my-1.5 text-[10px]" : "p-2 my-2 text-xs",
            theme === "dark" ? "bg-[#2a2e3b]" : "bg-gray-100"
          )}
          {...props}
        >
          {children}
        </code>
      )
    },
    pre: ({ children, className, ...props }) => (
      <pre className={cn(
        "overflow-auto",
        isMobile ? "my-1.5" : "my-2",
        className
      )} {...props}>{children}</pre>
    ),
    img: ({ src, alt, className, width, height, ...props }) => {
      if (!src || typeof src !== "string") return null;
    
      const safeWidth: number | `${number}` = typeof width === "number" ? width : `${Number(width)}`
      const safeHeight: number | `${number}` = typeof height === "number" ? height : `${Number(height)}`
    
      return (
        <div className={cn(
          "max-w-full overflow-hidden rounded-md",
          isMobile ? "my-1.5" : "my-2"
        )}>
          <Image
            src={src}
            width={safeWidth}
            height={safeHeight}
            alt={alt || "Imagen"}
            className={cn("w-full rounded-md object-cover", className)}
            unoptimized
            {...props}
          />
        </div>
      )
    },
    
    // Componentes de tabla mejorados y adaptados para móvil
    table: ({ children, className, ...props }) => (
      <div className={cn(
        "rounded-lg overflow-hidden",
        isMobile ? "my-2" : "my-4",
        theme === "dark"
          ? "shadow-sm"
          : "shadow-sm"
      )}>
        <div className="table-wrapper overflow-x-auto" 
            style={{ 
              maxWidth: '100%',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin'
            }}>
          <table className={cn(
            "caption-bottom w-full",
            // En lugar de min-width, definir table-layout para mejor control
            "table-auto",
            className
          )} {...props}>
            {children}
          </table>
        </div>
      </div>
    ),
    
    thead: ({ children, className, ...props }) => (
      <thead
        className={cn(
          "border-b",
          theme === "dark"
            ? "bg-gray-400 text-md"
            : "bg-gray-400 text-md",
          className
        )}
        {...props}
      >
        {children}
      </thead>
    ),
    
    tbody: ({ children, className, ...props }) => (
      <tbody
        className={cn(
          isMobile ? "text-xs" : "text-xs",
          theme === "dark"
            ? "bg-slate-900/60"
            : "bg-white",
          className
        )}
        {...props}
      >
        {children}
      </tbody>
    ),
    
    tr: ({ children, className, ...props }) => (
      <tr
        className={cn(
          "border-b transition-colors",
          theme === "dark"
            ? "border-[#dbe1ea] text-black bg-gray-200 hover:bg-gray-300/40 data-[state=selected]:bg-gray-400"
            : "border-[#dbe1ea] bg-gray-100 hover:bg-slate-50/80 data-[state=selected]:bg-slate-50",
          className
        )}
        {...props}
      >
        {children}
      </tr>
    ),
    
    th: ({ children, className, ...props }) => (
      <th
        className={cn(
          "text-left align-middle font-medium tracking-wider whitespace-nowrap",
          isMobile ? "px-1.5 h-8 text-[10px]" : "px-2 h-10 text-sm", // Reducir padding y altura en móvil
          theme === "dark"
            ? "text-white bg-gray-600"
            : "text-white bg-gray-600",
          className
        )}
        {...props}
      >
        {children}
      </th>
    ),
    
    td: ({ children, className, ...props }) => (
      <td
        className={cn(
          "align-middle",
          isMobile ? "px-1.5 py-1.5 text-xs" : "px-2 py-2", // Reducir padding en móvil
          theme === "dark"
            ? "text-black"
            : "text-black",
          className
        )}
        {...props}
      >
        {children}
      </td>
    ),
  }

  const handleSelectSuggestion = (suggestion: string) => {
    onSendMessage(suggestion)
  }

  const handleSelectOption = (option: string) => {
    onSendMessage(option)
  }

  const handleCopyMessage = (content: string) => {
    console.log("Mensaje copiado:", content)
  }

  const handleForwardMessage = (messageId: string) => {
    console.log("Reenviar mensaje:", messageId)
  }

  const handleLikeMessage = (messageId: string) => {
    console.log("Like al mensaje:", messageId)
  }

  const handleDislikeMessage = (messageId: string) => {
    console.log("Dislike al mensaje:", messageId)
  }

  return (
    <div 
      className={cn(
        "flex items-start w-full mx-auto",
        isUser ? "justify-end" : "justify-start",
        // Ajustes específicos para móvil
        isMobile ? "gap-1 py-1" : "gap-3 py-1"
      )}
      ref={messageRef}
      style={{ 
        contain: isStreaming ? 'content' : 'none',
        willChange: isStreaming ? 'contents' : 'auto'
      }}
    >
      
      <div className={cn(
        "flex flex-col",
        isUser ? "items-end w-[95%]" : "items-start"
      )}>
        <div
          className={cn(
            "rounded-2xl message-container overflow-hidden",
            // Ancho máximo para mensajes de usuario y ajuste automático a la derecha
            isUser ? "max-w-full ml-auto" : "w-full",
            // Padding reducido en móvil
            isMobile ? "px-2 py-2" : "px-3 py-2",
            isUser 
            ? theme === "dark" 
            ? "bg-indigo-500 text-white" 
            : "bg-gray-900 text-gray-200"
          : theme === "dark"
            ? "bg-[#212121] text-white"
            : "bg-white text-gray-900",
            isStreaming && !isUser && theme === "dark" && "border border-[#4e4b4c]",
          )}
        >
          {isUser ? (
            <p className={cn(
              "whitespace-pre-wrap break-words",
              isMobile ? "text-sm" : "text-md"
            )}>
              {processedContent}
            </p>
          ) : (
            <div className={cn(
              "markdown-content overflow-hidden",
              isMobile ? "text-sm" : "text-md"
            )}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                components={markdownComponents}
                skipHtml={isStreaming} // Evitar procesamiento HTML durante streaming para mejorar rendimiento
              >
                {processedContent}
              </ReactMarkdown>
             
              {/* Indicador de streaming dentro del mensaje */}
              {isStreaming && !isUser && (
                <div className="mt-2 mb-1 h-2">
                  <TypingIndicator></TypingIndicator>
                </div>
              )}
  
              {/* Botones de acción solo para mensajes del asistente */}
              {!isUser && !isStreaming && (
                <MessageActions
                  messageId={"1"}
                  messageContent={processedContent}
                  onCopy={handleCopyMessage}
                  onForward={handleForwardMessage}
                  onLike={handleLikeMessage}
                  onDislike={handleDislikeMessage}
                  isMobile={isMobile}
                />
              )}
  
              {/* Renderizar opciones como botones */}
              {options.length > 0 && <OptionsRenderer options={options} onSelectOption={handleSelectOption} isMobile={isMobile} />}
  
              {/* Renderizar sugerencias */}
              {suggestions.length > 0 && (
                <SuggestionsRenderer suggestions={suggestions} onSelectSuggestion={handleSelectSuggestion} isMobile={isMobile} />
              )}
            </div>
          )}
        </div>
       
      </div>
    </div>
  )
}