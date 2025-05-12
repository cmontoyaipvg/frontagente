"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { X, FileText, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { FilePreview } from "./file-preview"
import type { Agent } from "@/types/playground"
import { useTheme } from "@/components/theme-provider"
import { useMobile } from "@/hooks/use-mobile"
import { ArrowUpIcon, PaperclipIcon, StopIcon } from "@/components/icons"
import { AgentSelector } from "./agent-selector"
interface ChatInputProps {
  onSendMessage: (message: string, files?: File[]) => Promise<void>
  isLoading: boolean
  onCancelRequest?: () => void
  onVoiceModeToggle: () => void
  onDeepSearch?: () => void
  isMobile?: boolean
  agents: Agent[]  // Nueva prop
  selectedAgent: Agent | null  // Nueva prop
  onSelectAgent: (agent: Agent) => void  // Nueva prop
}

// Tipo personalizado para texto largo
interface TextFile {
  id: string
  content: string
  preview: string
}

export function ChatInput({
  onSendMessage,
  isLoading,
  onCancelRequest,
  onVoiceModeToggle,
  onDeepSearch,
  isMobile: propIsMobile,
  agents,          // Nueva prop
  selectedAgent,   // Nueva prop
  onSelectAgent,   // Nueva prop
}: ChatInputProps) {
  const [input, setInput] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [textFiles, setTextFiles] = useState<TextFile[]>([])
  const [textareaHeight, setTextareaHeight] = useState("auto")
  const [isDragging, setIsDragging] = useState(false) // Nuevo estado para rastrear el arrastre
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null) // Referencia para la zona de drop
  const { theme } = useTheme()
  const isMobileDetected = useMobile()
  const isMobile = propIsMobile !== undefined ? propIsMobile : isMobileDetected
  const [isDeepSearchActive, setIsDeepSearchActive] = useState(false)
  const requestAnimationRef = useRef<number | null>(null)
  // Constante para el límite de caracteres antes de convertir a archivo
  const TEXT_FILE_THRESHOLD = 500

  // Función para ajustar la altura del textarea
  const adjustHeight = useCallback(() => {
    if (requestAnimationRef.current) {
      cancelAnimationFrame(requestAnimationRef.current)
    }

    requestAnimationRef.current = requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.style.height = "auto"
        const newHeight = Math.min(inputRef.current.scrollHeight, 200)
        inputRef.current.style.height = `${newHeight}px`
        setTextareaHeight(`${newHeight}px`)
      }
    })
  }, [])

  // Comprobar si el texto excede el umbral y convertirlo en archivo
  useEffect(() => {
    if (input.length > TEXT_FILE_THRESHOLD) {
      // Crear un archivo de texto a partir del input
      const newTextFile: TextFile = {
        id: Date.now().toString(),
        content: input,
        preview: input.substring(0, 50) + (input.length > 50 ? "..." : ""),
      }

      // Añadir el archivo y limpiar el input
      setTextFiles((prev) => [...prev, newTextFile])
      setInput("")
    }

    adjustHeight()
  }, [input])

  // Manejar el pegado de imágenes
  const handlePaste = (e: React.ClipboardEvent) => {
    const clipboardItems = e.clipboardData.items
    const imageItems = Array.from(clipboardItems).filter((item) => item.type.indexOf("image") !== -1)

    if (imageItems.length > 0) {
      e.preventDefault() // Prevenir el pegado normal si hay imágenes

      imageItems.forEach((item) => {
        const blob = item.getAsFile()
        if (blob) {
          // Crear un nombre para la imagen
          const timestamp = new Date().toISOString().replace(/[-:.]/g, "")
          const filename = `pasted-image-${timestamp}.png`

          // Crear un nuevo archivo con el blob y un nombre descriptivo
          const file = new File([blob], filename, { type: blob.type })

          // Añadir al estado de archivos
          setFiles((prev) => [...prev, file])
        }
      })
    }
  }

  // Funciones para drag & drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Solo desactivar si el drag leave es del contenedor principal y no de un elemento hijo
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Añadir el efecto de copia para indicar que se pueden soltar archivos
    e.dataTransfer.dropEffect = "copy"
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)

    if (droppedFiles.length > 0) {
      // Si se soltaron archivos, añadirlos al estado
      setFiles((prev) => [...prev, ...droppedFiles])

      // Si hay texto en la transferencia de datos, intentar procesarlo
      if (e.dataTransfer.items) {
        Array.from(e.dataTransfer.items).forEach((item) => {
          if (item.kind === "string" && item.type.match("^text/plain")) {
            item.getAsString((text) => {
              if (text && text.length > 0) {
                // Si el texto es muy largo, convertirlo en archivo de texto
                if (text.length > TEXT_FILE_THRESHOLD) {
                  const newTextFile: TextFile = {
                    id: Date.now().toString(),
                    content: text,
                    preview: text.substring(0, 50) + (text.length > 50 ? "..." : ""),
                  }
                  setTextFiles((prev) => [...prev, newTextFile])
                } else {
                  // Si es texto corto, añadirlo al área de texto
                  setInput((prev) => prev + (prev ? "\n" : "") + text)
                }
              }
            })
          }
        })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && files.length === 0 && textFiles.length === 0) || isLoading) return

    // Construir el mensaje combinando input normal y archivos de texto
    let message = input
    if (textFiles.length > 0) {
      const textFileContents = textFiles.map((tf) => tf.content).join("\n\n")
      message = message ? message + "\n\n" + textFileContents : textFileContents
    }

    const currentFiles = [...files]

    // Limpiar estados antes de enviar
    setInput("")
    setFiles([])
    setTextFiles([])
    setTextareaHeight("auto")

    try {
      await onSendMessage(message, currentFiles.length > 0 ? currentFiles : undefined)
    } catch (error) {
      console.error("Error al enviar mensaje:", error)
    }

    // Focus the input after sending
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.style.height = "auto"
        inputRef.current.focus()
      }
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files || [])])
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveTextFile = (id: string) => {
    setTextFiles((prev) => prev.filter((tf) => tf.id !== id))
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Componente para renderizar archivos de texto
  const TextFilePreview = () => {
    if (textFiles.length === 0) return null

    return (
      <div className="mb-3">
        {textFiles.map((textFile) => (
          <div
            key={textFile.id}
            className={cn("flex items-center p-2 mb-2 rounded-md", theme === "dark" ? "bg-[#25262b]" : "bg-gray-200")}
          >
            <div
              className={cn(
                "flex items-center justify-center w-12 h-12 mr-3 rounded-md text-white",
                theme === "dark" ? "bg-[#1e1f24]" : "bg-gray-700",
              )}
            >
              <FileText size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium truncate", theme === "dark" ? "text-gray-200" : "text-gray-800")}>
                {textFile.preview}
              </p>
              <p className={cn("text-xs", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                {textFile.content.length} caracteres
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveTextFile(textFile.id)}
              className={cn(
                "ml-2 p-1 rounded-full",
                theme === "dark" ? "text-gray-400 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-300",
              )}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    )
  }

  // Overlay que aparece cuando estás arrastrando archivos
  const DragOverlay = () => {
    if (!isDragging) return null

    return (
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center rounded-xl z-10",
          "bg-opacity-80 border-2 border-dashed transition-all",
          theme === "dark" ? "bg-[#1e1f24] border-[#2885a2] text-white" : "bg-gray-100 border-[#2885a2] text-gray-800",
        )}
      >
        <Upload size={48} className="mb-2 text-[#2885a2]" />
        <p className="text-lg font-medium">Suelta aquí tus archivos</p>
        <p className="text-sm opacity-70">Imágenes, documentos, texto...</p>
      </div>
    )
  }

  return (
    <div
      ref={dropZoneRef}
      className={cn(
        "w-full border rounded-xl shadow-sm transition-all relative mb-4",
        isDragging
          ? theme === "dark"
            ? "bg-[#1a1b1d] border-[#2885a2]"
            : "bg-gray-100 border-[#2885a2]"
          : theme === "dark"
            ? "bg-[#2a2a2a] border-[#333333]"
            : "bg-white border-gray-200",
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <DragOverlay />
{/* Selector de agentes - Nueva sección */}

      {files.length > 0 && <FilePreview files={files} onRemove={handleRemoveFile} className="p-3" />}

      {/* Mostrar archivos de texto */}
      {textFiles.length > 0 && (
        <div className="px-3 pt-3">
          <TextFilePreview />
        </div>
      )}

<form onSubmit={handleSubmit} className="flex flex-col pr-2">
  {/* Área de texto con altura dinámica y soporte para pegar */}
  <textarea
    ref={inputRef}
    value={input}
    onChange={handleInputChange}
    onKeyDown={handleKeyDown}
    onPaste={handlePaste}
    placeholder="Send a message..."
    style={{ height: textareaHeight }}
    className={cn(
      "min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-lg px-4 py-3 text-base",
      theme === "dark"
        ? "bg-[#2a2a2a] text-white placeholder:text-gray-400 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        : "bg-gray-50 text-gray-900 placeholder:text-gray-500 focus:ring-1 focus:ring-blue-500 focus:outline-none",
    )}
  />

  {/* Botones de acción debajo del área de texto */}
  <div className="flex justify-between items-center mt-2">
    {/* Sección izquierda - Iconos de archivo y voz */}
    <div className="flex items-center space-x-2">
      <button
        type="button"
        onClick={triggerFileInput}
        className={cn(
          "rounded-full p-2 transition-colors",
          theme === "dark" 
            ? "text-gray-400 hover:bg-[#333333] hover:text-gray-300" 
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
        )}
      >
        <PaperclipIcon size={18} />
        <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />
      </button>

      <button
        type="button"
        onClick={onVoiceModeToggle}
        className={cn(
          "rounded-full p-2 transition-colors",
          theme === "dark" 
            ? "text-gray-400 hover:bg-[#333333] hover:text-gray-300" 
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" x2="12" y1="19" y2="22"></line>
        </svg>
      </button>
      <AgentSelector
        agents={agents}
        selectedAgent={selectedAgent}
        onSelectAgent={onSelectAgent}
        isMobile={isMobile}
      />

    </div>

    {/* Sección derecha - Selector de agente y botón de envío */}
    <div className="flex items-center space-x-2">
   
      {/* Botón de envío */}
      <button
        type={isLoading ? "button" : "submit"}
        onClick={isLoading ? onCancelRequest : undefined}
        disabled={!isLoading && !input.trim() && files.length === 0 && textFiles.length === 0}
        className={cn(
          "rounded-full p-2.5 transition-colors",
          isLoading
            ? theme === "dark"
              ? "bg-gray-100 hover:bg-gray-200 text-black"
              : "bg-gray-900 hover:bg-gray-800 text-white"
            : input.trim() || files.length > 0 || textFiles.length > 0
              ? theme === "dark"
                ? "bg-gray-100 hover:bg-gray-200 text-black"
                : "bg-gray-900 hover:bg-gray-800 text-white"
              : theme === "dark"
                ? "bg-[#333333] text-gray-400 cursor-not-allowed"
                : "bg-gray-100 text-gray-400 cursor-not-allowed",
        )}
      >
        {isLoading ? <StopIcon size={18} /> : <ArrowUpIcon size={18} />}
      </button>
    </div>
  </div>
</form>
    </div>
  )
}
