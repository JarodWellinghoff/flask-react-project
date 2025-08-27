// src/services/sseService.js
/**
 * Server-Sent Events service
 */
class SSEService {
  constructor() {
    this.eventSource = null;
    this.listeners = new Map();
  }

  /**
   * Connect to SSE stream
   */
  connect(
    taskId,
    baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000/api"
  ) {
    if (this.eventSource) {
      this.disconnect();
    }

    this.eventSource = new EventSource(`${baseUrl}/stream/${taskId}`);

    return new Promise((resolve, reject) => {
      this.eventSource.onopen = () => {
        console.log("SSE connection established");
        resolve();
      };

      this.eventSource.onerror = (error) => {
        console.error("SSE connection error:", error);
        reject(error);
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
        const data = JSON.parse(e.data);
        this.emit("message", data);
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
