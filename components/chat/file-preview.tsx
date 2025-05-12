"use client"

import { X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FilePreviewProps {
  files: File[]
  onRemove: (index: number) => void
  className?: string
}

export function FilePreview({ files, onRemove, className }: FilePreviewProps) {
  if (!files.length) return null

  return (
    <div className={cn("flex flex-wrap gap-2 p-2", className)}>
      {files.map((file, index) => {
        const isImage = file.type.startsWith("image/")
        const fileUrl = URL.createObjectURL(file)

        return (
          <div key={index} className="group relative rounded-md border border-dark-border bg-[#1a1d29] p-1">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-2 -top-2 z-10 h-5 w-5 rounded-full bg-red-500 p-0 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => onRemove(index)}
            >
              <X className="h-3 w-3 text-white" />
              <span className="sr-only">Remove file</span>
            </Button>

            {isImage ? (
              <div className="relative h-16 w-16 overflow-hidden rounded">
                <Image
                  src={fileUrl || "/placeholder.svg"}
                  alt={file.name}
                  fill
                  className="object-cover"
                  onLoad={() => URL.revokeObjectURL(fileUrl)}
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded bg-[#2a2e3b] p-2 text-xs text-white">
                {file.name.split(".").pop()?.toUpperCase() || "FILE"}
              </div>
            )}
            <p className="mt-1 max-w-16 truncate text-center text-xs text-gray-400">{file.name}</p>
          </div>
        )
      })}
    </div>
  )
}
