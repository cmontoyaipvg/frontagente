// tools.ts

export interface Tool {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface ToolCall {
  id: string;
  type: string;
  name: string;
  arguments: string;
}

export interface ToolResult {
  tool_call_id: string;
  output: string;
}

// Define nuestras herramientas disponibles
export const availableTools: Tool[] = [
  {
    type: "function",
    function: {
      name: "consultar_ventas",
      description:
        "Consulta datos de ventas y realiza análisis comerciales basados en el mensaje del usuario",
      parameters: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "Mensaje o consulta del usuario sobre datos de ventas",
          },
        },
        required: ["message"],
      },
    },
  },
];

// Ejecuta la llamada a la herramienta que llega por WebRTC
export async function executeToolCall(
  toolCall: ToolCall
): Promise<ToolResult> {
  const { id, name, arguments: args } = toolCall;

  // Intentamos parsear los argumentos
  let parsedArgs: any;
  try {
    parsedArgs = JSON.parse(args);
  } catch (err) {
    console.error("Error parsing toolCall arguments:", err);
    return {
      tool_call_id: id,
      output: "Error: argumentos inválidos para la herramienta.",
    };
  }

  let output: string;
  switch (name) {
    case "consultar_ventas":
      output = await consultarAgente(parsedArgs.message);
      break;
    default:
      output = `Tool "${name}" no está implementada`;
  }

  return {
    tool_call_id: id,
    output,
  };
}

// Implementación concreta que llama a tu agente de ventas
async function consultarAgente(mensaje: string): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("message", mensaje);
    formData.append("stream", "false");
    formData.append("user_id", "1023");
    formData.append("session_id", "voice8582");

    const response = await fetch(
      "http://localhost:7777/v1/playground/agents/ventas_01_voice/runs",
      { method: "POST", body: formData }
    );
    const data = await response.json();
    console.log(data.content)
    return data.content
  } catch (error: any) {
    console.error("Error al consultar el agente de ventas:", error);
    return `Ocurrió un error al procesar tu consulta: ${error.message || error}`;
  }
}
