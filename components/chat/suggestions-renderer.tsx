"use client"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

interface SuggestionsRendererProps {
 suggestions: string[]
 onSelectSuggestion: (suggestion: string) => void
 isMobile?: boolean
}

export function SuggestionsRenderer({ 
 suggestions, 
 onSelectSuggestion, 
 isMobile = false 
}: SuggestionsRendererProps) {
 const { theme } = useTheme()
 
 if (!suggestions || suggestions.length === 0) return null

 // Clases condicionales basadas en el tema
 const borderClass = theme === "dark" ? "border-gray-700" : "border-gray-200"
 const textHeaderClass = theme === "dark" ? "text-gray-300" : "text-gray-600"
 const buttonClass = theme === "dark"
   ? "bg-[#353847] text-gray-200 hover:bg-[#292d3e]"
   : "bg-gray-200 text-gray-700 hover:bg-gray-200"

 return (
   <div className={cn(
     "border-t",
     borderClass,
     // Ajuste de espaciado para móvil
     isMobile ? "mt-3 pt-2" : "mt-4 pt-3"
   )}>
  
     <div className={cn(
       "grid",
       // En móvil, mostrar una sola columna en dispositivos muy pequeños
       isMobile ? "grid-cols-1 sm:grid-cols-2 gap-2" : "grid-cols-2 gap-3"
     )}>
       {suggestions.map((suggestion, index) => (
         <button
           key={index}
           className={cn(
             "rounded-full whitespace-nowrap overflow-hidden text-ellipsis max-w-full",
             buttonClass,
             // Botones más compactos en móvil
             isMobile ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-[11px]"
           )}
           onClick={() => onSelectSuggestion(suggestion)}
         >
           {suggestion}
         </button>
       ))}
     </div>
   </div>
 )
}