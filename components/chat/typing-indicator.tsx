"use client"

export function TypingIndicator() {
  return (
    <div className="flex items-center justify-center bg-[#1f1f1f] rounded-md px-4 mb-4">
      <div className="flex items-center gap-2">
        <div className="flex space-x-1">
          <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
        </div>
        <span className="text-xs text-gray-400"></span>
      </div>
    </div>
  )
}
