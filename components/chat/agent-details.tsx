"use client"

import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Agent } from "@/types/playground"

interface AgentDetailsProps {
  agent: Agent
  onBack: () => void
}

export function AgentDetails({ agent, onBack }: AgentDetailsProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-dark-border">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-dark-muted">
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <h3 className="text-sm font-medium text-white">Agent Details</h3>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="flex flex-col py-6">
          <h2 className="text-xl font-bold text-white">TrilogIA</h2>

          <div className="mt-6 w-full">
            <h3 className="text-lg font-semibold text-white">Agente: {agent.name}</h3>

            <p className="mt-4 text-sm text-gray-400">{agent.description || agent.description}</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
