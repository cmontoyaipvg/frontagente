"use client";

import React, { useEffect, forwardRef, useState, useRef } from "react";
import type { PlaygroundChatMessage } from "@/types/playground";
import Image from "next/image";
import { ChatMessage } from "./chat-message";
import { useTheme } from "@/components/theme-provider";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ChatListProps {
  messages: PlaygroundChatMessage[];
  onSendMessage: (message: string) => void;
  isStreaming: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatList = forwardRef<HTMLDivElement, ChatListProps>(
  ({ messages, onSendMessage, isStreaming, scrollContainerRef }, ref) => {
    const { theme } = useTheme();
    const isMobile = useMobile();
    const [spacerHeight, setSpacerHeight] = useState(0);
    const previousMessagesLengthRef = useRef(0);
    const previousStreamingRef = useRef(false);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const previousSpacerRef = useRef(0);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    // Scroll al fondo con delay opcional
    const scrollToBottom = (behavior: ScrollBehavior = "smooth", delay = 0) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

      if (delay > 0) {
        scrollTimeoutRef.current = setTimeout(() => {
          container.scrollTo({ top: container.scrollHeight, behavior });
          scrollTimeoutRef.current = null;
        }, delay);
      } else {
        container.scrollTo({ top: container.scrollHeight, behavior });
      }
    };

    // Ajustar scrollTop al reducir el espaciador para evitar salto visual
    useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const diff = previousSpacerRef.current - spacerHeight;
      if (diff > 0) {
        container.scrollTop -= diff;
      }

      previousSpacerRef.current = spacerHeight;
    }, [spacerHeight]);

    // Al montar
    useEffect(() => {
      if (messages.length > 0) {
        scrollToBottom("auto");
      }

      return () => {
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      };
    }, []);

    // Manejo de inicio de streaming
    useEffect(() => {
      if (!messages.length) return;
      const viewportHeight = window.innerHeight;

      if (isStreaming && messages.length > previousMessagesLengthRef.current) {

          setSpacerHeight(viewportHeight * 0.5);
          scrollToBottom("auto", 50);
       
      }

      previousStreamingRef.current = isStreaming;
      previousMessagesLengthRef.current = messages.length;
    }, [messages, isStreaming]);

    // ResizeObserver para mensaje en streaming
    useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      
      if (
        isStreaming &&
        messages.length > 0 &&
        messages[messages.length - 1].role === "agent"
      ) {
        const viewportHeight = window.innerHeight;
        
        resizeObserverRef.current = new ResizeObserver((entries) => {
          if (entries.length === 0) return;
          
          // Limpiar el timer anterior si existe
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          
          // Asignar el nuevo timer a la referencia
          debounceTimerRef.current = setTimeout(() => {
            const messageElement = entries[0].target;
            const messageHeight = messageElement.getBoundingClientRect().height;
            const newSpacerHeight = Math.max(0, viewportHeight * 0.5 - messageHeight);
            
            if (Math.abs(spacerHeight - newSpacerHeight) > 5) {
              setSpacerHeight(newSpacerHeight);
              scrollToBottom("auto", 20);
            }
            
            debounceTimerRef.current = null;
          }, 16);
        });
        
        const streamingMessageEl = container.querySelector(
          ".chat-message-streaming"
        ) as HTMLDivElement;
        
        if (streamingMessageEl) {
          resizeObserverRef.current.observe(streamingMessageEl);
        }
      }
      
      return () => {
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
          resizeObserverRef.current = null;
        }
        
        // Ahora podemos acceder a la referencia en la limpieza
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
      };
    }, [isStreaming, messages, spacerHeight, scrollToBottom]);
    const isLastBotMessage = (message: PlaygroundChatMessage, index: number) => {
      if (message.role === "user") return false;
      for (let i = index + 1; i < messages.length; i++) {
        if (messages[i].role === "user") return false;
      }
      return true;
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col w-full",
          isMobile ? "px-3" : "px-1"
        )}
      >
        {messages.length === 0 ? (
            <EmptyState theme={theme} isMobile={isMobile} />
        ) : (
          <>
            {messages.map((message, index) => {
              const isLast = index === messages.length - 1;
              return (
                <div
                  key={index}
                  className={cn("w-full", isMobile ? "py-1" : "py-2")}
                  data-role={message.role}
                >
                  <ChatMessage
                    message={message}
                    onSendMessage={onSendMessage}
                    isStreaming={isLast && isStreaming && message.role === "agent"}
                    isMobile={isMobile}
                    isLastBotMessage={isLastBotMessage(message, index)}
                  />
                </div>
              );
            })}

            {spacerHeight > 0 && (
              <div
                style={{ height: spacerHeight, background: "transparent", transition: "height 0.3s ease-in-out" }}
              />
            )}
          </>
        )}
      </div>
    );
  }
);

ChatList.displayName = "ChatList";
const EmptyState = ({ theme, isMobile }: { theme: string; isMobile: boolean }) => (
  <div className="flex-1 flex items-center justify-center mt-5">
    <div className="flex flex-col items-center text-center max-w-md mx-auto animate-fade-in-scale">
      <h2 className={cn(
        "font-bold",
        isMobile ? "text-2xl mb-3" : "text-3xl mb-4",
        "animate-fade-in animation-delay-200"
      )}>
        <span className="text-white">Trilog</span>
        <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">IA</span>
      </h2>
      
      <p className={cn(
        "mb-6",
        isMobile ? "text-sm" : "text-base",
        theme === "dark" ? "text-gray-300" : "text-gray-600",
        "animate-fade-in-up animation-delay-200"
      )}>
        ¿En qué puedo ayudarte hoy?
      </p>
      
      <div className={cn(
        "flex flex-wrap gap-2 justify-center",
        isMobile ? "text-xs" : "text-sm",
        "animate-fade-in-up animation-delay-400"
      )}>
        {["Preguntas frecuentes", "Análisis de datos", "Soporte técnico"].map((hint) => (
          <span
            key={hint}
            className={cn(
              "px-3 py-1.5 rounded-full",
              theme === "dark" 
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              "transition-colors cursor-pointer hover:scale-105 transform"
            )}
          >
            {hint}
          </span>
        ))}
      </div>
    </div>
  </div>
)