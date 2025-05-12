import type { Agent, ComboboxAgent } from "@/types/playground"


export function mapAgentToCombobox(agent: Agent): ComboboxAgent {
  return {
    value: agent.agent_id,
    label: agent.name,
    description: agent.description,
    model: agent.model,
    storage: agent.storage,
    AudioRealTime: agent.AudioRealTime ?? false
  }
}

export function mapComboboxToAgent(combobox: ComboboxAgent): Agent {
  return {
    agent_id: combobox.value,
    name: combobox.label,
    description: combobox.description,
    model: combobox.model,
    storage: combobox.storage,
    AudioRealTime: combobox.AudioRealTime
  }
}
