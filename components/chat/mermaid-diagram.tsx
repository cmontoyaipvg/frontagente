"use client"

import { useEffect, useRef, useState, useContext } from "react"
import mermaid from "mermaid"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

interface MermaidDiagramProps {
  chart: string
  isStreaming?: boolean
  isMobile?: boolean
}

export function MermaidDiagram({ chart, isStreaming = false, isMobile = false }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [isMaximized, setIsMaximized] = useState<boolean>(false)
  const [diagramHeight, setDiagramHeight] = useState<number | null>(null)
  const mermaidRef = useRef<HTMLDivElement>(null)
  const initialRenderRef = useRef<boolean>(true)
  const [id] = useState(`mermaid-${Math.random().toString(36).substring(2, 11)}`)
  const { theme } = useTheme()
  
  // Estimar una altura inicial basada en la complejidad del diagrama
  // Altura reducida en móvil para menor impacto visual
  useEffect(() => {
    const lineCount = chart.split('\n').length;
    const estimatedHeight = Math.min(
      Math.max(lineCount * (isMobile ? 15 : 20), isMobile ? 80 : 100), 
      isMobile ? 300 : 400
    );
    setDiagramHeight(estimatedHeight);
  }, [chart, isMobile]);
  
  useEffect(() => {
    // Inicializar Mermaid una sola vez
    if (!window.mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: "loose",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        fontSize: isMobile ? 9 : 11,  // Tamaño de fuente reducido en móvil
        htmlLabels: true,
        darkMode: theme === "dark",
        themeVariables: theme === "dark" 
          ? {
              // Colores para tema oscuro
              primaryColor: "#2374ab",
              primaryTextColor: "#ffffff",
              primaryBorderColor: "#3a506b",
              lineColor: "#ffffff",
              secondaryColor: "#6c8eaf",
              tertiaryColor: "#1f2937",
              // Más variables específicas para otros tipos de diagramas
              // Asegura que el texto sea legible en fondo oscuro
              nodeBorder: "#4b5563",
              mainBkg: "#374151",
              nodeBkg: "#1f2937",
              textColor: "#e5e7eb",
            }
          : {
              // Colores para tema claro que aseguren buen contraste
              primaryColor: "#3b82f6",
              primaryTextColor: "#ffffff",
              primaryBorderColor: "#2563eb",
              secondaryColor: "#93c5fd",
              tertiaryColor: "#eff6ff",
            }
      });
      window.mermaidInitialized = true;
    } else {
      // Actualizar tema si cambia
      mermaid.initialize({
        theme: theme === "dark" ? "dark" : "light",
        darkMode: theme === "dark",
        fontSize: isMobile ? 9 : 11  // Ajustar tamaño de fuente al cambiar tema también
      });
    }
    
    // Guardar la posición de scroll actual antes de renderizar
    const scrollContainer = document.querySelector('.messages-container') as HTMLElement;
    const scrollPosition = scrollContainer?.scrollTop || 0;
    const scrollHeight = scrollContainer?.scrollHeight || 0;
    const clientHeight = scrollContainer?.clientHeight || 0;
    const isNearBottom = scrollHeight - scrollPosition - clientHeight < (isMobile ? 100 : 150);
    
    const timeoutId = setTimeout(async () => {
      try {
        setError(null)
        
        // Limpiar el código
        let processedChart = chart.trim();
        
        // Validación básica de sintaxis para prevenir errores comunes
        const hasValidSyntax = processedChart.includes('graph') || 
                            processedChart.includes('sequenceDiagram') ||
                            processedChart.includes('classDiagram') ||
                            processedChart.includes('stateDiagram') ||
                            processedChart.includes('gantt') ||
                            processedChart.includes('pie') ||
                            processedChart.includes('flowchart');
                            
        if (!hasValidSyntax && processedChart.length > 20) {
          throw new Error("Diagrama con sintaxis inválida o incompleta");
        }
        
        // Renderizar el diagrama con un ID único
        const { svg } = await mermaid.render(id, processedChart);
      
        // Para móvil, ajustar el SVG para que sea más compacto si es necesario
        if (isMobile) {
          // Crear un elemento temporal para manipular el SVG
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = svg;
          
          // Ajustar atributos del SVG si es necesario
          const svgElement = tempDiv.querySelector('svg');
          if (svgElement) {
            // Asegurar que el viewBox existe para mejor escalado
            if (!svgElement.getAttribute('viewBox') && 
                svgElement.getAttribute('width') && 
                svgElement.getAttribute('height')) {
              const width = parseInt(svgElement.getAttribute('width') || '0');
              const height = parseInt(svgElement.getAttribute('height') || '0');
              svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
            }
            
            // Asegurar que el SVG sea responsivo
            svgElement.setAttribute('width', '100%');
            svgElement.setAttribute('height', 'auto');
            svgElement.style.maxWidth = '100%';
          }
          
          setSvg(tempDiv.innerHTML);
        } else {
          setSvg(svg);
        }
   
        // Restaurar la posición de scroll después de que el diagrama se renderice
        if (scrollContainer) {
          // Usar requestAnimationFrame para asegurar que el DOM está actualizado
          requestAnimationFrame(() => {
            // Si estábamos cerca del fondo, mantener la vista en el fondo
            if (isNearBottom) {
              scrollContainer.scrollTo({
                top: scrollContainer.scrollHeight,
                behavior: 'auto'  // Usar 'auto' para evitar animaciones adicionales
              });
            } else {
              // Si no estábamos cerca del fondo, mantener la misma posición
              scrollContainer.scrollTop = scrollPosition;
            }
          });
        }
        
        // Ya no necesitamos reservar espacio
        setDiagramHeight(null);
        
      } catch (err) {
        console.error("Mermaid rendering error:", err)
        setError("Error al renderizar el diagrama. Por favor revise la sintaxis o espere a que termine de cargarse completamente.")
        
        // Intentar mostrar el código crudo si el diagrama no se puede renderizar
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = `<pre class="${cn(
            "overflow-x-auto rounded-md",
            isMobile ? "p-2 text-[10px]" : "p-3 text-xs",
            theme === "dark" ? "text-gray-300 bg-[#1a1d29]" : "text-gray-700 bg-gray-100"
          )}">No fue posible </pre>`;
        }
      }
    }, isStreaming ? (isMobile ? 700 : 500) : (isMobile ? 200 : 100)); 
    // Mayor delay durante streaming y en móvil para permitir carga completa
    
    return () => clearTimeout(timeoutId);
  }, [chart, id, isStreaming, theme, isMobile]);

  // Función para maximizar/minimizar el gráfico
  const toggleMaximize = () => {
    // Guardar la posición actual de scroll
    const scrollContainer = document.querySelector('.messages-container') as HTMLElement;
    const scrollPosition = scrollContainer?.scrollTop || 0;
    
    setIsMaximized(!isMaximized);
    
    // Restaurar la posición después del cambio de estado
    if (scrollContainer) {
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = scrollPosition;
      });
    }
  };

  if (error) {
    return (
      <div className={cn(
        "border rounded-md",
        isMobile ? "p-2 text-xs" : "p-3 text-sm",
        theme === "dark" 
          ? "bg-blue-900/30 border-blue-700 text-blue-300" 
          : "bg-blue-100 border-blue-300 text-blue-800"
      )}>
        <p className="font-bold">Cargando Grafico</p>
       
      </div>
    )
  }

  return (
    <div 
      className={cn(
        "relative",
        isMaximized 
          ? 'fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4' 
          : cn(
              "flex justify-center",
              isMobile ? "my-2" : "my-4"
            )
      )}
      style={{ contain: 'content' }}  // Ayuda a prevenir reflows
    >
      <div
        ref={mermaidRef}
        className={cn(
          "mermaid-diagram bg-transparent rounded-md overflow-hidden",
          isMaximized 
            ? 'max-h-[90vh] max-w-[90vw]' 
            : 'w-full max-w-full md:max-w-[90%]'
        )}
        style={!svg && diagramHeight ? { 
          minHeight: `${diagramHeight}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        } : {}}
        dangerouslySetInnerHTML={{ 
          __html: svg || `<div class="animate-pulse flex space-x-2 justify-center items-center">
            <div class="${isMobile ? 'h-1.5 w-1.5' : 'h-2 w-2'} bg-blue-400 rounded-full"></div>
            <div class="${isMobile ? 'h-1.5 w-1.5' : 'h-2 w-2'} bg-blue-400 rounded-full"></div>
            <div class="${isMobile ? 'h-1.5 w-1.5' : 'h-2 w-2'} bg-blue-400 rounded-full"></div>
          </div>` 
        }}
      />
      
      {/* Botón para maximizar/minimizar (más pequeño en móvil) */}
      {svg && (
        <button 
          onClick={toggleMaximize}
          className={cn(
            "absolute rounded-full transition-colors",
            isMobile ? "top-1 right-1 p-1.5" : "top-2 right-2 p-2",
            theme === "dark"
              ? "bg-[#2a2e3b] text-white hover:bg-[#3d4153]"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          )}
          title={isMaximized ? "Minimizar" : "Maximizar"}
          aria-label={isMaximized ? "Minimizar diagrama" : "Maximizar diagrama"}
        >
          {isMaximized ? (
            <svg xmlns="http://www.w3.org/2000/svg" width={isMobile ? "12" : "16"} height={isMobile ? "12" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width={isMobile ? "12" : "16"} height={isMobile ? "12" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
          )}
        </button>
      )}
    </div>
  )
}

// Agregar esta declaración para TypeScript
declare global {
  interface Window {
    mermaidInitialized?: boolean;
  }
}