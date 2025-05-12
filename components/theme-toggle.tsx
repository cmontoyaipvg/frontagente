"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isMobileDetected = useMobile()
  const isMobile = isMobileDetected
  
  return (
    <button
      className={cn(
        // Base styles
        "flex items-center justify-center aspect-square transition-all duration-300",
        // Make perfectly round with equal width and height + full border radius
        isMobile ? "w-7 h-7" : "w-10 h-10",
    
        // Theme colors
        theme === "light"
          ? "bg-white text-black"
          : "bg-[#202123] text-white",
        // Add slight shadow for better definition
        "shadow-sm"
      )}
      onClick={() => {
        document.documentElement.classList.add("theme-transition")
        setTheme(theme === "light" ? "dark" : "dark")
        
        setTimeout(() => {
          document.documentElement.classList.remove("theme-transition")
        }, 500)
      }}
    >
      {theme === "light" ? 
        <Moon className={`${isMobile ? "h-5 w-5" : "h-6 w-6"}`} /> :
        <Sun className={`${isMobile ? "h-5 w-5" : "h-6 w-6"}`} />
      }
      <span className="sr-only">Cambiar tema</span>
    </button>
  )
}