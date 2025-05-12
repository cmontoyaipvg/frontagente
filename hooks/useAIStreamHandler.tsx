'use client'
import { useCallback, useState, useRef } from 'react'
import { APIRoutes } from '@/src/app/api/routes'
import { RunEvent, type RunResponse } from '@/types/playground'
import { constructEndpointUrl } from '@/lib/constructEndpointUrl'
import { useQueryState } from 'nuqs'
import { usePlaygroundStore } from '@/src/app/store'
import useChatActions from '@/hooks/useChatActions'
import useAIResponseStream from './useAIResponseStream'
import { toast } from 'sonner'
import { useAuth } from "@/context/auth-context"

const useAIChatStreamHandler = () => {
  // El problema está aquí - cambiar a selectores individuales para evitar el bucle infinito
  const setMessages = usePlaygroundStore((s) => s.setMessages)
  const setStreamingErrorMessage = usePlaygroundStore((s) => s.setStreamingErrorMessage)
  const setIsStreaming = usePlaygroundStore((s) => s.setIsStreaming)
  const isStreaming = usePlaygroundStore((s) => s.isStreaming)
  const setSessionsData = usePlaygroundStore((s) => s.setSessionsData)
  const hasStorage = usePlaygroundStore((s) => s.hasStorage)
  const selectedEndpoint = usePlaygroundStore((s) => s.selectedEndpoint)
  
  const { addMessage, focusChatInput } = useChatActions()
  const [agentId] = useQueryState('agent')
  const [sessionId, setSessionId] = useQueryState('session')
  const { user } = useAuth()
  const { streamResponse } = useAIResponseStream()
  
  // Controlador para manejar la cancelación de la petición
  const [controller, setController] = useState<AbortController | null>(null)
  // Referencia para prevenir solicitudes duplicadas
  const pendingRequestRef = useRef<boolean>(false)

  const updateMessagesWithErrorState = useCallback(() => {
    setMessages((prevMessages) => {
      const newMessages = [...prevMessages]
      const lastMessage = newMessages[newMessages.length - 1]
      if (lastMessage && lastMessage.role === 'agent') {
        lastMessage.streamingError = true
      }
      return newMessages
    })
  }, [setMessages])

  const handleStreamResponse = useCallback(
    async (formData: FormData) => {
      // Verificación mejorada para evitar solicitudes duplicadas
      if (isStreaming || pendingRequestRef.current) {
        toast.error('Ya hay una respuesta en curso. Espera a que termine o detenla.')
        return
      }
      
      // Establecer flag para prevenir múltiples solicitudes
      pendingRequestRef.current = true
      setIsStreaming(true)

      // Obtener el mensaje del usuario del FormData
      const userMessage = formData.get('message') as string;

      // Limpiar mensajes de error previos
      setMessages((prevMessages) => {
        if (prevMessages.length >= 2) {
          const lastMessage = prevMessages[prevMessages.length - 1];
          const secondLastMessage = prevMessages[prevMessages.length - 2];
          if (
            lastMessage.role === 'agent' &&
            lastMessage.streamingError &&
            secondLastMessage.role === 'user'
          ) {
            return prevMessages.slice(0, -2);
          }
        }
        return prevMessages;
      });

      // Añadir mensaje del usuario
      addMessage({
        role: 'user',
        content: userMessage,
        created_at: Math.floor(Date.now() / 1000)
      });

      // Añadir mensaje vacío para la respuesta del agente
      addMessage({
        role: 'agent',
        content: '',
        tool_calls: [],
        streamingError: false,
        created_at: Math.floor(Date.now() / 1000) + 1
      });

      let lastContent = '';
      let newSessionId = sessionId;

      try {
        // Crear un controlador para poder cancelar la petición
        const abortController = new AbortController();
        setController(abortController);

        if (!agentId) {
          throw new Error('No se ha seleccionado un agente');
        }

        const endpointUrl = constructEndpointUrl(selectedEndpoint);
        const playgroundRunUrl = APIRoutes.AgentRun(endpointUrl).replace(
          '{agent_id}',
          agentId
        );

        const requestFormData = new FormData();
        formData.forEach((value, key) => {
          requestFormData.append(key, value);
        });

        await streamResponse({
          apiUrl: playgroundRunUrl,
          requestBody: requestFormData,
          signal: abortController.signal,
          onChunk: (chunk) => {
            if (chunk.event === RunEvent.RunResponse) {
              setMessages((prevMessages) => {
                const newMessages = [...prevMessages];
                const lastMessage = newMessages[newMessages.length - 1];
                if (
                  lastMessage &&
                  lastMessage.role === 'agent' &&
                  typeof chunk.content === 'string'
                ) {
                  const uniqueContent = chunk.content.replace(lastContent, '');
                  lastMessage.content += uniqueContent;
                  lastContent = chunk.content;

                  const toolCalls = [...(chunk.tools ?? [])];
                  if (toolCalls.length > 0) {
                    lastMessage.tool_calls = toolCalls;
                  }
                  
                  // Manejar información adicional
                  if (chunk.extra_data?.reasoning_steps) {
                    lastMessage.extra_data = {
                      ...lastMessage.extra_data,
                      reasoning_steps: chunk.extra_data.reasoning_steps
                    };
                  }

                  if (chunk.extra_data?.references) {
                    lastMessage.extra_data = {
                      ...lastMessage.extra_data,
                      references: chunk.extra_data.references
                    };
                  }

                  lastMessage.created_at = chunk.created_at ?? lastMessage.created_at;
                  
                  // Manejar archivos multimedia en la respuesta
                  if (chunk.images) {
                    lastMessage.images = chunk.images;
                  }
                  if (chunk.videos) {
                    lastMessage.videos = chunk.videos;
                  }
                  if (chunk.audio) {
                    lastMessage.audio = chunk.audio;
                  }
                } else if (
                  chunk.response_audio?.transcript &&
                  typeof chunk.response_audio?.transcript === 'string'
                ) {
                  const transcript = chunk.response_audio.transcript;
                  lastMessage.response_audio = {
                    ...lastMessage.response_audio,
                    transcript: (lastMessage.response_audio?.transcript || '') + transcript
                  };
                }
                return newMessages;
              });
            } else if (chunk.event === RunEvent.RunError) {
              updateMessagesWithErrorState();
              const errorContent = chunk.content;
              setStreamingErrorMessage(typeof errorContent === 'string' ? errorContent : String(errorContent));
            } else if (chunk.event === RunEvent.RunCompleted) {
              // Actualización final al completar el stream
              setMessages((prevMessages) => {
                const newMessages = prevMessages.map((message, index) => {
                  if (
                    index === prevMessages.length - 1 &&
                    message.role === 'agent'
                  ) {
                    let updatedContent;
                    if (typeof chunk.content === 'string') {
                      updatedContent = chunk.content;
                    } else {
                      try {
                        updatedContent = JSON.stringify(chunk.content);
                      } catch {
                        updatedContent = 'Error parsing response';
                      }
                    }
                    return {
                      ...message,
                      content: updatedContent,
                      tool_calls: chunk.tools && chunk.tools.length > 0 
                        ? [...chunk.tools] 
                        : message.tool_calls,
                      images: chunk.images ?? message.images,
                      videos: chunk.videos ?? message.videos,
                      response_audio: chunk.response_audio,
                      created_at: chunk.created_at ?? message.created_at,
                      extra_data: {
                        reasoning_steps:
                          chunk.extra_data?.reasoning_steps ??
                          message.extra_data?.reasoning_steps,
                        references:
                          chunk.extra_data?.references ??
                          message.extra_data?.references
                      }
                    };
                  }
                  return message;
                });
                return newMessages;
              });
            }
            
            // Actualizar ID de sesión si cambia
            if (chunk.session_id && chunk.session_id !== newSessionId) {
              newSessionId = chunk.session_id;
              setSessionId(chunk.session_id);
            }
          },
          onError: (error) => {
            if (error.name !== 'AbortError') {
              updateMessagesWithErrorState();
              setStreamingErrorMessage(error.message);
            }
          },
          onComplete: () => {
            // Actualizar datos de sesión si es necesario
            if (newSessionId && newSessionId !== sessionId && hasStorage) {
              const placeHolderSessionData = {
                session_id: newSessionId,
                title: userMessage,
                created_at: Math.floor(Date.now() / 1000)
              };
              setSessionsData((prevSessionsData) => [
                placeHolderSessionData,
                ...(prevSessionsData ?? [])
              ]);
            }
            // Limpiar el controlador al terminar
            setController(null);
            setIsStreaming(false);
            pendingRequestRef.current = false;
          }
        });
      } catch (error) {
        // No mostrar error de cancelación si se abortó intencionalmente
        if (error && typeof error === 'object' && 'name' in error && error.name !== 'AbortError') {
          updateMessagesWithErrorState();
          setStreamingErrorMessage(
            error instanceof Error ? error.message : String(error)
          );
        }
      } finally {
        focusChatInput();
        setIsStreaming(false);
        pendingRequestRef.current = false;
        setController(null);
      }
    },
    [
      isStreaming,
      addMessage,
      updateMessagesWithErrorState,
      selectedEndpoint,
      streamResponse,
      agentId,
      setStreamingErrorMessage,
      setSessionsData,
      sessionId,
      setSessionId,
      hasStorage,
      user,
      focusChatInput,
      setMessages,
      setIsStreaming
    ]
  );

  /**
   * Detiene el proceso de streaming en curso
   */
  const stopStreaming = useCallback(() => {
    if (controller) {
      controller.abort();
      setIsStreaming(false);
      pendingRequestRef.current = false;
      setController(null);
    }
  }, [controller, setIsStreaming]);

  return {
    handleStreamResponse,
    stopStreaming,
    isStreaming
  };
};

export default useAIChatStreamHandler;