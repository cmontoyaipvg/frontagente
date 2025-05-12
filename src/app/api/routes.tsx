// src/app/api/routes.ts
export const APIRoutes = {
    GetPlaygroundAgents: (PlaygroundApiUrl: string) =>
      `${PlaygroundApiUrl}/v1/playground/agents`,
    AgentRun: (PlaygroundApiUrl: string) =>
      `${PlaygroundApiUrl}/v1/playground/agents/{agent_id}/runs`,
    PlaygroundStatus: (PlaygroundApiUrl: string) =>
      `${PlaygroundApiUrl}/v1/playground/status`,
    GetPlaygroundSessions: (
      PlaygroundApiUrl: string,
      agentId: string,
      userId?: string
    ) => {
      const baseUrl = `${PlaygroundApiUrl}/v1/playground/agents/${agentId}/sessions`;
      return userId ? `${baseUrl}?user_id=${userId}` : baseUrl;
    },
    GetPlaygroundSession: (
      PlaygroundApiUrl: string,
      agentId: string,
      sessionId: string,
      userId?: string
    ) => {
      const baseUrl = `${PlaygroundApiUrl}/v1/playground/agents/${agentId}/sessions/${sessionId}`;
      return userId ? `${baseUrl}?user_id=${userId}` : baseUrl;
    },
    DeletePlaygroundSession: (
      PlaygroundApiUrl: string,
      agentId: string,
      sessionId: string,
      userId?: string
    ) => {
      const baseUrl = `${PlaygroundApiUrl}/v1/playground/agents/${agentId}/sessions/${sessionId}`;
      return userId ? `${baseUrl}?user_id=${userId}` : baseUrl;
    }
  };
  