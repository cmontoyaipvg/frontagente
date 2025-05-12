"use client"

import { Check, ChevronDown } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import type { Agent } from "@/types/playground"

interface AgentSelectorProps {
  agents: Agent[]
  selectedAgent: Agent | null
  onSelectAgent: (agent: Agent) => void
  isMobile?: boolean
}

export function AgentSelector({ agents, selectedAgent, onSelectAgent, isMobile }: AgentSelectorProps) {
  const [open, setOpen] = useState(false)
  const { theme } = useTheme()
  
  return (
    <div className="flex items-center justify-center w-full mb-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "min-w-[140px] max-w-[250px] h-10 px-3 py-1 rounded-lg text-sm font-medium",
              "transition-colors duration-200",
              theme === "dark"
                ? "bg-[#5e4698] border-[#3f3f46] text-white hover:bg-[#323232] hover:border-gray-600"
                : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-gray-300"
            )}
          >
            <span className="truncate">
              {selectedAgent ? selectedAgent.name : "Seleccionar agente"}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className={cn(
            "w-full max-w-[400px] p-1 rounded-lg shadow-lg",
            theme === "dark"
              ? "bg-[#403e40] border-[#3f3f46] text-white"
              : "bg-white border-gray-200 text-gray-900"
          )}
          align="center"
          sideOffset={5}
        >
          {/* Modelos principales */}
          <div className="space-y-2">
            {agents.slice(0, 2).map((agent) => (
              <div
                key={agent.agent_id}
                className={cn(
                  "flex items-start justify-between p-3 rounded-lg cursor-pointer transition-colors",
                  selectedAgent?.agent_id === agent.agent_id
                    ? theme === "dark"
                      ? "bg-[#343436] text-white"
                      : "bg-gray-100 text-gray-900"
                    : theme === "dark"
                      ? "hover:bg-[#2c2c2e] text-gray-300"
                      : "hover:bg-gray-50 text-gray-700"
                )}
                onClick={() => {
                  onSelectAgent(agent)
                  setOpen(false)
                }}
              >
                <div className="space-y-1 flex-1">
                  <div className="font-light bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    {agent.name}
                  </div>
                  <div className={cn(
                    "text-sm line-clamp-1",
                    theme === "dark" ? "text-gray-200" : "text-gray-500"
                  )}>
                    {agent.description}
                  </div>
                </div>
                {selectedAgent?.agent_id === agent.agent_id && (
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500 flex-shrink-0 ml-3">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Línea divisoria si hay más agentes */}
          {agents.length > 2 && (
            <>
              <div className={cn(
                "my-4 border-t",
                theme === "dark" ? "border-[#3f3f46]" : "border-gray-200"
              )} />
              
              {/* Más modelos */}
              <div className="space-y-2">
                {agents.slice(2).map((agent) => (
                  <div
                    key={agent.agent_id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                      selectedAgent?.agent_id === agent.agent_id
                        ? theme === "dark"
                          ? "bg-[#3f3f46] text-white"
                          : "bg-gray-100 text-gray-900"
                        : theme === "dark"
                          ? "hover:bg-[#3f3f46] text-gray-300"
                          : "hover:bg-gray-50 text-gray-700"
                    )}
                    onClick={() => {
                      onSelectAgent(agent)
                      setOpen(false)
                    }}
                  >
                    <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent font-medium">
                      {agent.name}
                    </span>
                    {selectedAgent?.agent_id === agent.agent_id && (
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500 flex-shrink-0 ml-3">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}