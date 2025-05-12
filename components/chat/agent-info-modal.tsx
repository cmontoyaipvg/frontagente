"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Agent } from "@/types/playground"

interface AgentInfoModalProps {
  agent: Agent | null
  isOpen: boolean
  onClose: () => void
  isMobile?: boolean
}

export function AgentInfoModal({ agent, isOpen, onClose }: AgentInfoModalProps) {
  if (!agent) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-dark-background border-dark-border text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">TrilogIA</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Agente: {agent.name}</h3>
          <p className="mt-4 text-sm text-gray-400">{agent.description || agent.description}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
