"use client"
import { useMobile } from "@/hooks/use-mobile"
import { useTheme } from "@/components/theme-provider"

interface SuggestionProps {
 suggestions: string[]
 onSelectSuggestion: (suggestion: string) => void
 isMobile?: boolean
}

export function ChatSuggestions({ suggestions, onSelectSuggestion }: SuggestionProps) {
 const isMobile = useMobile()
 const { theme } = useTheme()
 const displaySuggestions = isMobile ? suggestions.slice(0, 4) : suggestions

 // Clases condicionales basadas en el tema
 const suggestionButtonClasses = theme === "dark"
   ? "bg-[#353847] text-white hover:bg-[#252836]"
   : "bg-gray-100 text-gray-800 hover:bg-gray-200"

 return (
   <div className="py-2 px-2 max-w-3xl mx-auto w-full">
     <div className="flex flex-wrap gap-2 justify-center">
       {displaySuggestions.map((suggestion, index) => (
         <button
           key={index}
           className={`rounded-full px-5 py-1.5 text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[220px] ${suggestionButtonClasses}`}
           onClick={() => onSelectSuggestion(suggestion)}
         >
           {suggestion}
         </button>
       ))}
     </div>
   </div>
 )
}