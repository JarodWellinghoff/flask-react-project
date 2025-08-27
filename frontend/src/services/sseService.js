// src/services/sseService.js
/**
 * Server-Sent Events service
 */
class SSEService {
  constructor() {
    this.eventSource = null;
    this.listeners = new Map();
    this.isManuallyClosing = false;
  }

  /**
   * Connect to SSE stream
   */
  connect(
    taskId,
    baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
  ) {
    if (this.eventSource) {
      this.disconnect();
    }

    const sseUrl = `${baseUrl}/stream/${taskId}`;
    console.log("Attempting SSE connection to:", sseUrl);

    this.eventSource = new EventSource(sseUrl);
    this.isManuallyClosing = false;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error("SSE connection timeout");
        this.disconnect();
        reject(new Error("SSE connection timeout"));
      }, 10000);

      this.eventSource.onopen = () => {
        clearTimeout(timeout);
        console.log("SSE connection established");
        resolve();
      };

      this.eventSource.onerror = (error) => {
        clearTimeout(timeout);

        // Check if this is a normal closure (server finished) vs actual error
        if (
          this.eventSource?.readyState === EventSource.CLOSED &&
          !this.isManuallyClosing
        ) {
          console.log("SSE stream closed by server (normal completion)");
          // Don't treat this as an error - it's expected when task completes
          return;
        }

        if (this.eventSource?.readyState === EventSource.CONNECTING) {
          console.log("SSE reconnecting...");
          return; // Let it retry
        }

        // Only log as error for actual connection failures
        if (
          this.eventSource?.readyState === EventSource.CLOSED &&
          this.isManuallyClosing
        ) {
          console.log("SSE manually disconnected");
          return;
        }

        console.error("SSE connection error:", {
          readyState: this.eventSource?.readyState,
          url: sseUrl,
          timestamp: Date.now(),
        });

        // Only reject if we haven't successfully connected yet
        if (this.eventSource?.readyState !== EventSource.OPEN) {
          reject(
            new Error(
              `SSE connection failed. ReadyState: ${this.eventSource?.readyState}`
            )
          );
        }
      };
    });
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event).add(callback);

    if (event === "message" && this.eventSource) {
      this.eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          this.emit("message", data);

          // If we receive a completion message, expect the connection to close
          if (data.type === "calculation_complete") {
            console.log("Received completion message, connection will close");
          }
        } catch (err) {
          console.error("Failed to parse SSE message:", e.data);
        }
      };
    }
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => callback(data));
    }
  }

  /**
   * Disconnect from SSE stream
   */
  disconnect() {
    console.debug("Disconnecting SSE");
    this.isManuallyClosing = true;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.listeners.clear();
    }
  }

  /**
   * Get connection state
   */
  getState() {
    if (!this.eventSource) return "CLOSED";

    switch (this.eventSource.readyState) {
      case EventSource.CONNECTING:
        return "CONNECTING";
      case EventSource.OPEN:
        return "OPEN";
      case EventSource.CLOSED:
        return "CLOSED";
      default:
        return "UNKNOWN";
    }
  }
}

export default new SSEService();
