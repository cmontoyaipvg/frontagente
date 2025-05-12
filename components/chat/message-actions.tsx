"use client"

import { useState } from "react"
import { Copy, Share2, ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"
import { useTheme } from "@/components/theme-provider"

interface MessageActionsProps {
  messageId: string
  messageContent: string
  onCopy: (content: string) => void
  onForward: (messageId: string) => void
  onLike: (messageId: string) => void
  onDislike: (messageId: string) => void
  isMobile?: boolean
}

export function MessageActions({
  messageId,
  messageContent,
  onCopy,
  onForward,
  onLike,
  onDislike,
  isMobile = false
}: MessageActionsProps) {
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [copied, setCopied] = useState(false)
  const { theme } = useTheme()

  // Tamaños adaptados para móvil
  const buttonSize = isMobile ? "h-7 w-7" : "h-8 w-8"
  const iconSize = isMobile ? "h-3 w-3" : "h-4 w-4"
  const smallIconSize = isMobile ? "h-2.5 w-2.5" : "h-3 w-3"

  const handleCopy = () => {
    navigator.clipboard.writeText(messageContent).then(() => {
      onCopy(messageContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  const handleLike = () => {
    if (disliked) setDisliked(false)
    setLiked(!liked)
    onLike(messageId)
  }

  const handleDislike = () => {
    if (liked) setLiked(false)
    setDisliked(!disliked)
    onDislike(messageId)
  }

  // Contenido de botones con tooltips o versión básica para móvil
  const renderButton = (
    icon: React.ReactNode, 
    label: string, 
    onClick: () => void, 
    className: string,
    tooltipText: string,
    showTooltip: boolean = true
  ) => {
    // En móvil, solo renderizar botones sin tooltips para mejor rendimiento
    if (isMobile) {
      return (
        <Button
          variant="ghost"
          size="icon"
          className={className}
          onClick={onClick}
          aria-label={label}
        >
          {icon}
          <span className="sr-only">{label}</span>
        </Button>
      )
    }

    // Versión completa con tooltips para desktop
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={className}
              onClick={onClick}
            >
              {icon}
              <span className="sr-only">{label}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Clases específicas según el tema
  const hoverBgClass = theme === 'dark' 
    ? 'text-gray-500 hover:bg-gray-700' 
    : 'hover:bg-gray-100'

  return (
    <div className={cn(
      "flex items-center",
      isMobile ? "gap-0 mt-1.5" : "gap-1 mt-2"
    )}>
      {/* Botón Copiar */}
      {/* Botón Me gusta */}
      {renderButton(
        <ThumbsUp className={smallIconSize} />,
        "Me gusta",
        handleLike,
        cn(buttonSize, "rounded-full", hoverBgClass, liked && "text-blue-500"),
        "Me gusta"
      )}

      {/* Botón No me gusta */}
      {renderButton(
        <ThumbsDown className={smallIconSize} />,
        "No me gusta",
        handleDislike,
        cn(buttonSize, "rounded-full", hoverBgClass, disliked && "text-red-500"),
        "No me gusta"
      )}
    </div>
  )
}