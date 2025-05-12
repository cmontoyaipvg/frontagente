import { useCallback } from 'react'
import { type RunResponse } from '@/types/playground'

function processChunk(
  chunk: RunResponse,
  onChunk: (chunk: RunResponse) => void
) {
  if (!chunk || typeof chunk !== 'object') {
    return;
  }
  
  try {
    onChunk(chunk)
  } catch (error) {
    console.error('Error procesando chunk:', error);
  }
}

function parseBuffer(
  buffer: string,
  onChunk: (chunk: RunResponse) => void
): string {
  let jsonStartIndex = buffer.indexOf('{')
  let jsonEndIndex = -1

  while (jsonStartIndex !== -1) {
    let braceCount = 0
    let inString = false

    for (let i = jsonStartIndex; i < buffer.length; i++) {
      const char = buffer[i]

      if (char === '"' && buffer[i - 1] !== '\\') {
        inString = !inString
      }

      if (!inString) {
        if (char === '{') braceCount++
        if (char === '}') braceCount--
      }

      if (braceCount === 0) {
        jsonEndIndex = i
        break
      }
    }

    if (jsonEndIndex !== -1) {
      const jsonString = buffer.slice(jsonStartIndex, jsonEndIndex + 1)
      try {
        const parsed = JSON.parse(jsonString) as RunResponse
        processChunk(parsed, onChunk)
      } catch {
        break
      }
      buffer = buffer.slice(jsonEndIndex + 1).trim()
      jsonStartIndex = buffer.indexOf('{')
      jsonEndIndex = -1
    } else {
      break
    }
  }

  return buffer
}

export default function useAIResponseStream() {
  const streamResponse = useCallback(
    async (options: {
      apiUrl: string
      headers?: Record<string, string>
      requestBody: FormData | Record<string, unknown>
      onChunk: (chunk: RunResponse) => void
      onError: (error: Error) => void
      onComplete: () => void
      signal?: AbortSignal
    }): Promise<void> => {
      const {
        apiUrl,
        headers = {},
        requestBody,
        onChunk,
        onError,
        onComplete,
        signal
      } = options

      let buffer = ''
      let isCompleted = false;

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            ...(!(requestBody instanceof FormData) && {
              'Content-Type': 'application/json'
            }),
            ...headers
          },
          body:
            requestBody instanceof FormData
              ? requestBody
              : JSON.stringify(requestBody),
          signal
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
          throw errorData
        }

        if (!response.body) {
          throw new Error('No response body')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        const processStream = async (): Promise<void> => {
          if (isCompleted) return;
          
          try {
            const { done, value } = await reader.read()
            if (done) {
              buffer = parseBuffer(buffer, onChunk)
              if (!isCompleted) {
                isCompleted = true;
                onComplete();
              }
              return
            }
            buffer += decoder.decode(value, { stream: true })

            buffer = parseBuffer(buffer, onChunk)
            await processStream()
          }catch (error: unknown) {
            if (error instanceof DOMException && error.name === 'AbortError') {
              if (!isCompleted) {
                isCompleted = true;
                onComplete();
              }
              return;
            }
            throw error;
          }
        }
        
        await processStream()
      } catch (error) {
        if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
          if (!isCompleted) {
            isCompleted = true;
            onComplete()
          }
        } else if (typeof error === 'object' && error !== null && 'detail' in error) {
          if (!isCompleted) {
            isCompleted = true;
            onError(new Error(String(error.detail)))
          }
        } else {
          if (!isCompleted) {
            isCompleted = true;
            onError(new Error(String(error)))
          }
        }
      }
    },
    []
  )

  return { streamResponse }
}