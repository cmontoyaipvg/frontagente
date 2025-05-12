"use client"

import { ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import { cva, type VariantProps } from "class-variance-authority"

// Estilo mejorado con variantes más distintivas
const optionButtonVariants = cva(
  "rounded-full transition-all flex items-center justify-center shadow-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      theme: {
        light: "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 focus-visible:ring-blue-500",
        dark: "bg-gradient-to-r from-blue-700 to-blue-800 text-white hover:from-blue-800 hover:to-blue-900 focus-visible:ring-blue-700",
      },
      size: {
        sm: "px-3 py-1 text-xs",
        md: "px-4 py-1.5 text-sm",
        lg: "px-5 py-2 text-base",
      },
    },
    defaultVariants: {
      theme: "light",
      size: "md",
    },
  }
)

interface OptionButtonProps 
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof optionButtonVariants> {
  active?: boolean
}

const OptionButton = forwardRef<HTMLButtonElement, OptionButtonProps>(
  ({ className, theme, size, active, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          optionButtonVariants({ theme, size }),
          active && "ring-2 ring-offset-2 shadow-md transform scale-105",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
OptionButton.displayName = "OptionButton"

interface OptionsRendererProps {
  options: string[]
  onSelectOption: (option: string) => void
  isMobile?: boolean
  selectedOption?: string
  className?: string
  alignment?: "left" | "right" | "center" // Añadido prop de alineación
}

export function OptionsRenderer({
  options,
  onSelectOption,
  isMobile = false,
  selectedOption,
  className,
  alignment = "right", // Por defecto alineado a la derecha
}: OptionsRendererProps) {
  const { theme } = useTheme()
  const currentTheme = theme === "dark" ? "dark" : "light"

  if (!options || options.length === 0) return null

  // Clases de alineación
  const alignmentClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end", // Alineación a la derecha
  }

  return (
    <div
      className={cn(
        "flex flex-wrap w-full", // Ancho completo para que la alineación funcione
        alignmentClasses[alignment], // Aplicar alineación
        isMobile ? "mt-3 gap-1.5" : "mt-4 gap-2",
        className
      )}
      role="group"
      aria-label="Opciones disponibles"
    >
      {options.map((option, index) => (
        <OptionButton
          key={index}
          theme={currentTheme}
          size={isMobile ? "sm" : "md"}
          onClick={() => onSelectOption(option)}
          active={selectedOption === option}
          aria-pressed={selectedOption === option}
        >
          {option}
        </OptionButton>
      ))}
    </div>
  )
}