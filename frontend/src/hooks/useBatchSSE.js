// Enhanced SSE hook for batch operations
// src/hooks/useBatchSSE.js
import { useEffect, useRef, useState } from "react";
import sseService from "../services/sseService";

export function useBatchSSE(taskId, isBatchMode) {
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

  useEffect(() => {
    if (
      lastMessage?.type === "calculation_complete" ||
      lastMessage?.type === "batch_completed"
    ) {
      setTimeout(() => {
        sseService.disconnect();
        setConnectionState("CLOSED");
      }, 500);
    }
  }, [lastMessage]);

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
