// src/components/Debug/AcknowledgmentMonitor.jsx - Optional debug component
import React, { useState, useEffect } from "react";
import apiService from "../../services/api";

export function AcknowledgmentMonitor({ taskId, isVisible = false }) {
  const [acknowledgedMessages, setAcknowledgedMessages] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!isVisible || !taskId) return;

    setIsMonitoring(true);
    const messageIds = new Set();

    // Listen for messages that require acknowledgment
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.requires_ack && data.message_id) {
          messageIds.add(data.message_id);

          // Track this message
          setAcknowledgedMessages((prev) => [
            ...prev,
            {
              messageId: data.message_id,
              type: data.type,
              timestamp: Date.now(),
              acknowledged: false,
            },
          ]);

          // Check acknowledgment status after a delay
          setTimeout(async () => {
            try {
              const status = await apiService.checkAcknowledgmentStatus(
                taskId,
                data.message_id
              );
              setAcknowledgedMessages((prev) =>
                prev.map((msg) =>
                  msg.messageId === data.message_id
                    ? { ...msg, acknowledged: status.acknowledged }
                    : msg
                )
              );
            } catch (error) {
              console.warn("Failed to check acknowledgment status:", error);
            }
          }, 1000);
        }
      } catch (error) {
        // Ignore parsing errors
      }
    };

    // This is a simplified example - in practice, you'd need to tap into the SSE stream
    console.log("Acknowledgment monitoring enabled for task:", taskId);

    return () => {
      setIsMonitoring(false);
      setAcknowledgedMessages([]);
    };
  }, [taskId, isVisible]);

  if (!isVisible || !taskId) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "white",
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "16px",
        maxWidth: "400px",
        maxHeight: "300px",
        overflow: "auto",
        fontSize: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
      }}>
      <h4 style={{ margin: "0 0 12px 0", fontSize: "14px" }}>
        Acknowledgment Monitor
      </h4>

      <div style={{ marginBottom: "12px" }}>
        <strong>Task ID:</strong> {taskId}
      </div>

      <div style={{ marginBottom: "12px" }}>
        <strong>Status:</strong> {isMonitoring ? "Monitoring" : "Stopped"}
      </div>

      <div>
        <strong>Messages:</strong>
        {acknowledgedMessages.length === 0 ? (
          <div style={{ fontStyle: "italic", color: "#666" }}>
            No messages requiring acknowledgment yet
          </div>
        ) : (
          acknowledgedMessages.map((msg, index) => (
            <div
              key={msg.messageId}
              style={{
                padding: "4px 8px",
                margin: "4px 0",
                backgroundColor: msg.acknowledged ? "#d1fae5" : "#fee2e2",
                borderRadius: "4px",
                border: `1px solid ${msg.acknowledged ? "#10b981" : "#ef4444"}`,
              }}>
              <div style={{ fontWeight: "bold" }}>
                {msg.type} {msg.acknowledged ? "✓" : "⏳"}
              </div>
              <div style={{ fontSize: "10px", color: "#666" }}>
                {msg.messageId.slice(0, 8)}... •
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => setAcknowledgedMessages([])}
        style={{
          marginTop: "12px",
          padding: "4px 8px",
          fontSize: "12px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          background: "white",
          cursor: "pointer",
        }}>
        Clear
      </button>
    </div>
  );
}
