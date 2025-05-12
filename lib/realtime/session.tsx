
let cachedKey: string | null = null;
export async function createRealtimeSession(): Promise<string> {

  if (cachedKey) return cachedKey;
  const res = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-realtime-preview-2024-12-17",
      voice: "echo",
      instructions: "Tu Nombre es Claudio Asistente Comercial de Implementos Chile respondes solo consultas de ventas como ventas por sucursal UEN Categoria Sucursal Canal de Venta cuando necesites consultar datos de ventas siempre indica al usuario con un mensaje que realizaras la consulta y que espere un momento esto es muy importante ademas usa un Acento chileno formal con velocidad rapida",
      input_audio_transcription: { model: "whisper-1" },
      turn_detection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 500,
        silence_duration_ms: 1000,
      },
      tools: [
        {
          type: "function",
          name: "consultar_ventas",
          description:
            "Consulta datos de ventas y realiza análisis comerciales basados en el mensaje del usuario",
          parameters: {
            type: "object",
            properties: {
              message: {
                type: "string",
                description: "Mensaje del usuario de solicitud de datos de ventas",
              },
            },
            required: ["message"],
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI /sessions error ${res.status}: ${err}`);
  }

  // 2. Parseamos la respuesta y extraemos client_secret
  const json = await res.json();
  let secret: string;

  // Casos: { client_secret: "abc" } o { client_secret: { value: "abc" } }
  if (typeof json.client_secret === "string") {
    secret = json.client_secret;
  } else if (
    typeof json.client_secret === "object" &&
    typeof json.client_secret.value === "string"
  ) {
    secret = json.client_secret.value;
  } else {
    console.error("Respuesta inesperada de /sessions:", json);
    throw new Error("Formato inesperado de client_secret");
  }

  cachedKey = secret;
  return secret;
}
