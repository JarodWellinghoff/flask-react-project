// src/hooks/useSSE.js
import { useEffect, useRef, useState } from "react";
import sseService from "../services/sseService";

/**
 * Hook for managing SSE connections
 */
export function useSSE(taskId) {
  const [connectionState, setConnectionState] = useState("CLOSED");
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const messageHandlerRef = useRef();

  useEffect(() => {
    if (!taskId) return;

    const connect = async () => {
      try {
        setConnectionState("CONNECTING");
        await sseService.connect(taskId);
        setConnectionState("OPEN");
        setError(null);

        // Set up message handler
        messageHandlerRef.current = (data) => {
          setLastMessage(data);
        };

        sseService.on("message", messageHandlerRef.current);
      } catch (err) {
        setError(err.message);
        setConnectionState("CLOSED");
      }
    };

    connect();

    return () => {
      if (messageHandlerRef.current) {
        sseService.off("message", messageHandlerRef.current);
      }
      sseService.disconnect();
      setConnectionState("CLOSED");
    };
  }, [taskId]);

  return {
    connectionState,
    lastMessage,
    error,
    reconnect: () => {
      if (taskId) {
        sseService.disconnect();
        sseService.connect(taskId);
      }
    },
  };
}
