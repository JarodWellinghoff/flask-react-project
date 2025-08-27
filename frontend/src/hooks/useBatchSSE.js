// src/hooks/useBatchSSE.js - Enhanced with acknowledgment support
import { useEffect, useRef, useState } from "react";
import sseService from "../services/sseService";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export function useBatchSSE(taskId, isBatchMode) {
  const [connectionState, setConnectionState] = useState("CLOSED");
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const messageHandlerRef = useRef();
  const acknowledgeQueue = useRef(new Set()); // Track pending acknowledgments

  // Function to send acknowledgment to backend
  const sendAcknowledgment = async (taskId, messageId) => {
    try {
      const ackKey = `${taskId}-${messageId}`;

      // Prevent duplicate acknowledgments
      if (acknowledgeQueue.current.has(ackKey)) {
        return;
      }

      acknowledgeQueue.current.add(ackKey);

      const response = await fetch(`${API_BASE}/ack/${taskId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message_id: messageId,
        }),
      });

      if (!response.ok) {
        console.warn(
          `Failed to acknowledge message ${messageId}:`,
          response.status
        );
      } else {
        console.debug(`Acknowledged message ${messageId} for task ${taskId}`);
      }

      // Remove from queue after processing (success or failure)
      acknowledgeQueue.current.delete(ackKey);
    } catch (error) {
      console.error(`Error acknowledging message ${messageId}:`, error);
      // Remove from queue even on error to prevent infinite retries
      acknowledgeQueue.current.delete(`${taskId}-${messageId}`);
    }
  };

  useEffect(() => {
    if (!taskId) return;

    const connect = async () => {
      try {
        setConnectionState("CONNECTING");
        await sseService.connect(taskId);
        setConnectionState("OPEN");
        setError(null);

        messageHandlerRef.current = async (data) => {
          console.debug("Received SSE message:", data);

          // Send acknowledgment if required
          if (data.requires_ack && data.message_id) {
            console.debug(`Message ${data.message_id} requires acknowledgment`);

            // Send acknowledgment immediately (don't wait)
            sendAcknowledgment(taskId, data.message_id);
          }

          // Set the message for processing
          setLastMessage(data);
        };

        sseService.on("message", messageHandlerRef.current);
      } catch (err) {
        console.error("SSE connection error:", err);
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
      // Clear acknowledgment queue on cleanup
      acknowledgeQueue.current.clear();
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
        acknowledgeQueue.current.clear();
      }, 500);
    }
  }, [lastMessage]);

  return {
    connectionState,
    lastMessage,
    error,
    reconnect: () => {
      if (taskId) {
        acknowledgeQueue.current.clear();
        sseService.disconnect();
        sseService.connect(taskId);
      }
    },
  };
}
