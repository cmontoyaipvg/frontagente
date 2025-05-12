"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Bar, Line, Pie, Doughnut, Radar, PolarArea, Scatter, Bubble } from "react-chartjs-2"
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement, 
  ArcElement, 
  RadialLinearScale, 
  Tooltip, 
  Legend 
} from "chart.js"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend
)

// Configurar los elementos globales para bordes redondeados (estilo shadcn)
ChartJS.defaults.elements.bar.borderRadius = 6;
ChartJS.defaults.elements.bar.borderSkipped = false;

// Función de formato para separar miles con punto
const formatNumberWithDot = (value: number | string) => {
  if (typeof value === 'number') {
    // Convertir a string y separar con punto para miles
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  return value;
};

interface ChartRendererProps {
  data: any
  isMobile?: boolean
  isStreaming?: boolean
  onChartRendered?: () => void
}

export function ChartRenderer({ data, isMobile = false, isStreaming = false,onChartRendered }: ChartRendererProps) {
  const { type, labels, datasets, options, title } = data
  const { theme } = useTheme()
  const bgColor = theme === "dark" ? "bg-[#f4f4f4]" : "bg-[#f4f4f4]"
  const [isRendered, setIsRendered] = useState(false)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [chartHeight, setChartHeight] = useState<number | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const [isMaximized, setIsMaximized] = useState(false)
  const isRenderingRef = useRef(false)
  const prevHeight = useRef<number>(0)
  const chartInstanceRef = useRef<any>(null)
  
  // Paletas de colores estilo shadcn
  const colorPalettes = {
    // Paleta para gráficos corporativos (barras, líneas)
    corporate: theme === "dark" 
      ? [
          'rgba(30, 64, 175, 0.85)',   // Azul oscuro (principal - color institucional)
         'rgba(101, 163, 13, 0.85)',   // Verde oscuro
          'rgba(2, 132, 199, 0.85)',   // Azul cielo
          'rgba(202, 138, 4, 0.85)',   // Amarillo oscuro
          'rgba(13, 148, 136, 0.85)',  // Verde azulado
          'rgba(8, 47, 73, 0.85)',     // Azul marino
          'rgba(20, 184, 166, 0.85)',  // Verde turquesa
          'rgba(101, 163, 13, 0.85)',  // Verde lima
          'rgba(30, 58, 138, 0.85)',   // Azul muy oscuro
          'rgba(180, 183, 13, 0.85)',  // Amarillo verdoso
        ]
      : [
          'rgba(37, 99, 235, 0.85)',   // Azul medio (principal - color institucional)
         'rgba(101, 163, 13, 0.85)',   // Verde
          'rgba(14, 165, 233, 0.85)',  // Azul cielo
          'rgba(234, 179, 8, 0.85)',   // Amarillo
          'rgba(20, 184, 166, 0.85)',  // Verde azulado
          'rgba(3, 105, 161, 0.85)',   // Azul oceánico
          'rgba(5, 150, 105, 0.85)',   // Verde esmeralda
          'rgba(132, 204, 22, 0.85)',  // Verde lima
          'rgba(59, 130, 246, 0.85)',  // Azul brillante
          'rgba(202, 138, 4, 0.85)',   // Amarillo ámbar
        ],
    
    // Paleta para gráficos de barras alternadas
    alternatingBars: theme === "dark"
      ? [
          'rgba(30, 64, 175, 0.9)'   // Verde oscuro
        ]
      : [
          'rgba(30, 64, 175, 0.9)'   // Verde
        ],
    
    // Paleta para gráficos circulares (pie, doughnut)
    pie: theme === "dark"
      ? [
          'rgba(30, 64, 175, 0.9)',    // Azul oscuro (principal)
          'rgba(22, 101, 52, 0.9)',    // Verde oscuro
          'rgba(2, 132, 199, 0.9)',    // Azul cielo
          'rgba(202, 138, 4, 0.9)',    // Amarillo oscuro
          'rgba(13, 148, 136, 0.9)',   // Verde azulado
          'rgba(8, 47, 73, 0.9)',      // Azul marino
          'rgba(20, 184, 166, 0.9)',   // Verde turquesa
          'rgba(101, 163, 13, 0.9)',   // Verde lima
          'rgba(30, 58, 138, 0.9)',    // Azul muy oscuro
          'rgba(180, 183, 13, 0.9)',   // Amarillo verdoso
        ]
      : [
          'rgba(37, 99, 235, 0.9)',    // Azul medio (principal)
          'rgba(22, 163, 74, 0.9)',    // Verde
          'rgba(14, 165, 233, 0.9)',   // Azul cielo
          'rgba(234, 179, 8, 0.9)',    // Amarillo
          'rgba(20, 184, 166, 0.9)',   // Verde azulado
          'rgba(3, 105, 161, 0.9)',    // Azul oceánico
          'rgba(5, 150, 105, 0.9)',    // Verde esmeralda
          'rgba(132, 204, 22, 0.9)',   // Verde lima
          'rgba(59, 130, 246, 0.9)',   // Azul brillante
          'rgba(202, 138, 4, 0.9)',    // Amarillo ámbar
        ],
        
    // Colores para gráficos de líneas con áreas
    area: theme === "dark"
      ? [
          'rgba(30, 64, 175, 0.5)',    // Azul oscuro
          'rgba(22, 101, 52, 0.5)',    // Verde oscuro
          'rgba(2, 132, 199, 0.5)',    // Azul cielo
          'rgba(202, 138, 4, 0.5)',    // Amarillo oscuro
          'rgba(13, 148, 136, 0.5)',   // Verde azulado
        ]
      : [
          'rgba(37, 99, 235, 0.4)',    // Azul medio
          'rgba(22, 163, 74, 0.4)',    // Verde
          'rgba(14, 165, 233, 0.4)',   // Azul cielo
          'rgba(234, 179, 8, 0.4)',    // Amarillo
          'rgba(20, 184, 166, 0.4)',   // Verde azulado
        ]
  };

  // Función para aplicar colores a los datasets si no tienen colores definidos
  const applyColorPalette = useCallback((datasetsList: any[], chartType: string) => {
    let palette;
    
    // Seleccionar paleta apropiada según el tipo de gráfico
    if (['pie', 'doughnut', 'polarArea'].includes(chartType)) {
      palette = colorPalettes.pie;
    } else if (chartType === 'area') {
      palette = colorPalettes.area;
    } else if (chartType === 'bar' || chartType === 'groupedBar') {
      // Para barras simples, usar colores alternados si hay un solo dataset
      palette = datasetsList.length === 1 ? colorPalettes.alternatingBars : colorPalettes.corporate;
    } else {
      palette = colorPalettes.corporate;
    }
    
    // Aplicar colores según el tipo de gráfico
    return datasetsList.map((dataset, index) => {
      // Si es un gráfico circular, aplicar todos los colores al dataset
      if (['pie', 'doughnut', 'polarArea'].includes(chartType)) {
        if (!dataset.backgroundColor) {
          return {
            ...dataset,
            backgroundColor: palette,
            borderColor: theme === "dark" ? 'rgba(23, 23, 23, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            borderWidth: 2
          };
        }
      } 
      // Si es una barra simple, potencialmente usar colores alternados
      else if ((chartType === 'bar' || chartType === 'groupedBar') && datasetsList.length === 1) {
        // Crear un array de colores alternados para cada barra
        const barCount = dataset.data.length;
        const alternatingColors = Array(barCount).fill(0).map((_, i) => 
          palette[i % palette.length]
        );
        
        if (!dataset.backgroundColor) {
          return {
            ...dataset,
            backgroundColor: alternatingColors,
            borderColor: theme === "dark" ? 'rgba(23, 23, 23, 0.3)' : 'rgba(255, 255, 255, 0.3)',
            borderWidth: 1,
            borderRadius: 6, // Esquinas redondeadas estilo shadcn
            borderSkipped: false // Para que todas las esquinas sean redondeadas
          };
        }
      }
      // Para otros tipos, aplicar un color por dataset
      else {
        const colorIndex = index % palette.length;
        const color = palette[colorIndex];
        const borderColor = color.replace(/[^,]+(?=\))/, '1.0'); // Versión sólida para bordes
        
        if (!dataset.backgroundColor) {
          return {
            ...dataset,
            backgroundColor: chartType === 'line' ? borderColor : color,
            borderColor: borderColor,
            borderWidth: 2,
            borderRadius: chartType.includes('bar') ? 6 : 0, // Barras redondeadas
            borderSkipped: false,
            pointBackgroundColor: borderColor,
            pointBorderColor: theme === "dark" ? '#151515' : '#ffffff',
            pointHoverBackgroundColor: theme === "dark" ? '#ffffff' : '#000000',
            pointHoverBorderColor: borderColor,
            tension: chartType === 'line' || chartType === 'area' ? 0.3 : 0 // Curvas suaves para líneas
          };
        }
      }
      
      return dataset;
    });
  }, [theme, colorPalettes]);
  
  // Memoizar los datos del gráfico para evitar recálculos innecesarios
  const chartData = useMemo(() => ({
    labels,
    datasets: datasets ? applyColorPalette(datasets, type) : []
  }), [labels, datasets, type, applyColorPalette]);
  
  // Estimar una altura inicial basada en la complejidad del gráfico
  useEffect(() => {
    const datasetCount = datasets?.length || 1;
    const labelCount = labels?.length || 5;
    const estimatedHeight = Math.min(
      Math.max(100, labelCount * (isMobile ? 15 : 20)), 
      isMobile ? 300 : 400
    );
    setChartHeight(estimatedHeight);
  }, [datasets, labels, isMobile]);

  // Validar la estructura de datos del gráfico
  const validateChartData = useCallback(() => {
    if (!type) return false;
    if (!datasets || !Array.isArray(datasets) || datasets.length === 0) return false;
    
    if (['bar', 'line', 'area', 'groupedBar', 'horizontalBar', 'stackedBar'].includes(type)) {
      if (!labels || !Array.isArray(labels) || labels.length === 0) return false;
    }
    
    return true;
  }, [type, datasets, labels]);

  // Implementar un ResizeObserver para detectar cambios en el tamaño del gráfico
  useEffect(() => {
    if (!chartRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      
      const currentHeight = entry.contentRect.height;
      
      // Solo considerar cambios significativos
      if (Math.abs(currentHeight - prevHeight.current) > 25) {
        prevHeight.current = currentHeight;
        
        // Detectar si estamos en la parte inferior
        const container = document.querySelector('.messages-container');
        if (container) {
          const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
          
          if (isAtBottom) {
            // Esperar a que termine el render actual
            requestAnimationFrame(() => {
              // Usar 'auto' para un scroll instantáneo y evitar animaciones
              container.scrollTo({top: container.scrollHeight, behavior: 'auto'});
            });
          }
        }
      }
    });
    
    resizeObserver.observe(chartRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Efecto para renderizar el gráfico con control para evitar re-renders
  useEffect(() => {
    if (isRenderingRef.current) return;
    
    isRenderingRef.current = true;
    
    const timeoutId = setTimeout(() => {
      try {
        if (!data || (Array.isArray(data) && data.length === 0)) {
          setIsRendered(false);
          isRenderingRef.current = false;
          return;
        }
        
     
        
        setRenderError(null);
        setIsRendered(true);
        setChartHeight(null);
        
        // Notificar que el gráfico está renderizado
        if (typeof onChartRendered === 'function') {
          // Pequeño retraso para asegurar que el DOM está actualizado
          setTimeout(() => onChartRendered(), 50);
        }
        
        // Solo registrar en consola una vez para evitar spam
        console.log(`Gráfico ${type} renderizado correctamente`);
        
      } catch (err) {
        console.error("Error al renderizar el gráfico:", err);
      } finally {
        // Asegurar que se resetea el flag bajo cualquier circunstancia
        isRenderingRef.current = false;
      }
    }, isStreaming ? (isMobile ? 1000 : 800) : (isMobile ? 400 : 200));
    
    return () => {
      clearTimeout(timeoutId);
      isRenderingRef.current = false;
    };
  }, [data, validateChartData, isStreaming, isMobile, type, onChartRendered]);
  // Opciones base para todos los gráficos
  const baseOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: isStreaming ? 0 : 500 // Deshabilitar animaciones durante streaming
    },
    layout: {
      padding: 10
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: theme === "dark" ? "#374151" : "#374151",
          font: {
            size: isMobile ? 10 : 12,
            family: "'Inter', 'system-ui', sans-serif"
          },
          boxWidth: isMobile ? 12 : 16,
          padding: isMobile ? 8 : 12,
          usePointStyle: true // Usar puntos en lugar de rectángulos para la leyenda
        }
      },
      title: {
        display: !!title,
        text: title || "",
        color: theme === "dark" ? "#374151" : "#374151",
        font: {
          size: isMobile ? 12 : 16,
          weight: 'bold',
          family: "'Inter', 'system-ui', sans-serif"
        },
        padding: {
          top: 8,
          bottom: 8
        }
      },
      tooltip: {
        backgroundColor: theme === "dark" ? '#ffffff' : 'rgba(250, 250, 250, 0.9)',
        titleColor: theme === "dark" ? '#1f2937' : '#1f2937',
        bodyColor: theme === "dark" ? '#1f2937' : '#1f2937',
        borderColor: theme === "dark" ? 'rgba(210, 210, 210, 0.5)' : 'rgba(210, 210, 210, 0.5)',
        borderWidth: 1,
        padding: 10,
        bodyFont: {
          size: isMobile ? 10 : 12,
          family: "'Inter', 'system-ui', sans-serif"
        },
        titleFont: {
          size: isMobile ? 10 : 12,
          weight: 'bold',
          family: "'Inter', 'system-ui', sans-serif"
        },
        cornerRadius: 6,
        caretSize: 6,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
      
            // Obtener el valor correcto según el tipo de gráfico
            let value;
            if (context.parsed && context.parsed.r !== undefined) {
              value = context.parsed.r;  // Para gráficos como 'polarArea'
            } else if (context.parsed && context.parsed.y !== undefined) {
              value = context.parsed.y;  // Para gráficos de líneas, barras, etc.
            } else if (context.parsed && context.parsed.x !== undefined) {
              value = context.parsed.x;  // Para gráficos de dispersión (scatter), etc.
            }
      
            // Si hay un valor, formatearlo
            if (value !== undefined) {
              label += formatNumberWithDot(value);  // Función para formatear el número con puntos como separador de miles
            } else {
              label += "No disponible";
            }
            
            return label;
          },
          title: function(tooltipItems: any[]) {
            // El título puede ser la etiqueta del eje X o la etiqueta del dataset
            return tooltipItems[0].label;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: theme === "dark" ? "#4b5563" : "#4b5563",
          font: {
            size: isMobile ? 9 : 11,
            family: "'Inter', 'system-ui', sans-serif"
          },
          maxRotation: 45,
          minRotation: 0
        },
        grid: {
          color: theme === "dark" ? "#dbe1ea" : "#dbe1ea",
          drawBorder: false
        },
        border: {
          display: false
        }
      },
      y: {
        ticks: {
          color: theme === "dark" ? "#4b5563" : "#4b5563",
          font: {
            size: isMobile ? 9 : 11,
            family: "'Inter', 'system-ui', sans-serif"
          },
          padding: 8,
          // Formatear los valores del eje Y para usar punto como separador de miles
          callback: function(value: any) {
            return formatNumberWithDot(value);
          }
        },
        grid: {
          color: theme === "dark" ? "#dbe1ea" : "#dbe1ea",
          drawBorder: false
        },
        border: {
          display: false
        }
      }
    },
    ...options
  }), [theme, isMobile, title, options, isStreaming]);

  // Función para togglear maximización
  const toggleMaximize = useCallback(() => {
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
  }, [isMaximized]);

  // Función para renderizar el gráfico adecuado según el tipo
  const renderChart = useCallback(() => {
    switch (type) {
      case "bar":
      case "groupedBar":
        return <Bar data={chartData} options={baseOptions} />
      case "horizontalBar":
        return <Bar data={chartData} options={{ 
          ...baseOptions, 
          indexAxis: "y" as const,
          elements: {
            bar: {
              borderRadius: 6,
              borderSkipped: false
            }
          } 
        }} />
      case "stackedBar":
        return <Bar data={chartData} options={{ 
          ...baseOptions, 
          scales: { 
            x: { stacked: true, ...baseOptions.scales.x }, 
            y: { stacked: true, ...baseOptions.scales.y } 
          },
          elements: {
            bar: {
              borderRadius: 6,
              borderSkipped: false
            }
          }
        }} />
      case "line":
        return <Line data={chartData} options={{
          ...baseOptions,
          elements: {
            line: {
              tension: 0.3 // Líneas curvas suaves
            },
            point: {
              radius: 3,
              hoverRadius: 5
            }
          }
        }} />
      case "area":
        return <Line data={chartData} options={{ 
          ...baseOptions, 
          elements: { 
            line: { 
              fill: true,
              tension: 0.3 // Líneas curvas suaves
            },
            point: {
              radius: 3,
              hoverRadius: 5
            }
          } 
        }} />
      case "pie":
        return <Pie data={chartData} options={{
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            legend: {
              ...baseOptions.plugins.legend,
              position: "right" as const,
            },
            // Mostrar valores en el gráfico de pastel
            datalabels: {
              formatter: (value: any) => {
                return formatNumberWithDot(value);
              }
            }
          }
        }} />
      case "doughnut":
        return <Doughnut data={chartData} options={{
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            legend: {
              ...baseOptions.plugins.legend,
              position: "right" as const,
            }
          },
          cutout: '70%'
        }} />
      case "radar":
        return <Radar data={chartData} options={{
          ...baseOptions,
          scales: {
            r: {
              ticks: {
                color: theme === "dark" ? "#9ca3af" : "#4b5563",
                backdropColor: 'transparent',
                font: {
                  size: isMobile ? 8 : 10
                },
                // Formatear valores para radar también
                callback: function(value: any) {
                  return formatNumberWithDot(value);
                }
              },
              pointLabels: {
                color: theme === "dark" ? "#e5e7eb" : "#374151",
                font: {
                  size: isMobile ? 9 : 11
                }
              },
              angleLines: {
                color: theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"
              },
              grid: {
                color: theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"
              }
            }
          }
        }} />
      case "polarArea":
        return <PolarArea data={chartData} options={{
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            legend: {
              ...baseOptions.plugins.legend,
              position: "right" as const,
            },
            // Mostrar valores en el gráfico de pastel
            datalabels: {
              formatter: (value: any) => {
                return formatNumberWithDot(value);
              }
            }
          }
        }} />
      case "scatter":
        return <Scatter data={{ datasets: chartData.datasets }} options={baseOptions} />
      case "bubble":
        return <Bubble data={{ datasets: chartData.datasets }} options={baseOptions} />
      default:
        return <p className="text-red-500">Tipo de gráfico no soportado: {type}</p>
    }
  }, [type, chartData, baseOptions, theme, isMobile]);

  if (renderError) {
    return (
      <div className={cn(
        "chart-container rounded-lg overflow-hidden shadow-md",
        isMobile ? "p-2 text-xs" : "p-3 text-sm",
        bgColor
      )}  style={!isRendered && chartHeight ? { 
        minHeight: `400px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        contain: 'strict'         // Más aislamiento para prevenir reflows
      } : isRendered ? {
        height: isMaximized ? '80vh' : `${chartHeight || 400}px`,
        padding: '16px',
        contain: 'content'        // Aislar contenido
      } : {}}>
        <div className="animate-pulse flex space-x-2 justify-center items-center">
            <div className={`${isMobile ? 'h-1.5 w-1.5' : 'h-5 w-5'} bg-orange-600 rounded-full`}></div>
            <div className={`${isMobile ? 'h-1.5 w-1.5' : 'h-5 w-5'} bg-orange-600 rounded-full`}></div>
            <div className={`${isMobile ? 'h-1.5 w-1.5' : 'h-5 w-5'} bg-orange-600 rounded-full`}></div>
          </div>
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
      style={{ 
        contain: 'content',         // Ayuda a prevenir reflows
        willChange: 'transform',    // Optimiza para cambios
        transform: 'translateZ(0)'  // Fuerza composición de GPU
      }}
    >
      <div
        ref={chartRef}
        className={cn(
          "chart-container rounded-lg overflow-hidden shadow-md",
          isMaximized 
            ? 'max-h-[110vh] max-w-[90vw] w-full h-[120vh]' 
            : 'w-full',
          bgColor
        )}
        style={!isRendered && chartHeight ? { 
          minHeight: `400px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          contain: 'strict'         // Más aislamiento para prevenir reflows
        } : isRendered ? {
          height: isMaximized ? '80vh' : `${chartHeight || 400}px`,
          padding: '16px',
          contain: 'content'        // Aislar contenido
        } : {}}
      >
        {isRendered ? (
          renderChart()
        ) : (
          <div className="animate-pulse flex space-x-2 justify-center items-center">
            <div className={`${isMobile ? 'h-1.5 w-1.5' : 'h-5 w-5'} bg-orange-600 rounded-full`}></div>
            <div className={`${isMobile ? 'h-1.5 w-1.5' : 'h-5 w-5'} bg-orange-600  rounded-full`}></div>
            <div className={`${isMobile ? 'h-1.5 w-1.5' : 'h-5 w-5'} bg-orange-600 rounded-full`}></div>
          </div>
        )}
      </div>
      
      {/* Botón para maximizar/minimizar (más pequeño en móvil) */}
      {isRendered && (
        <button 
          onClick={toggleMaximize}
          className={cn(
            "absolute rounded-full transition-colors shadow-md",
            isMobile ? "top-1 right-1 p-1.5" : "top-2 right-2 p-2",
            theme === "dark"
              ? "bg-[#2a2e3b] text-white hover:bg-[#3d4153]"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          )}
          title={isMaximized ? "Minimizar" : "Maximizar"}
          aria-label={isMaximized ? "Minimizar gráfico" : "Maximizar gráfico"}
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
    chartJSInitialized?: boolean;
  }
}