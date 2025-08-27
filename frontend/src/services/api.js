// src/services/api.js - Updated with batch calculation support
/**
 * API service for backend communication (Enhanced with batch support)
 */
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

class APIService {
  constructor() {
    this.API_BASE = API_BASE;
  }

  /**
   * Start a new single calculation
   */
  async startCalculation(numIterations, testParams = {}) {
    const response = await fetch(`${API_BASE}/start-calculation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        num_iterations: numIterations,
        test_params: testParams,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Start a batch calculation
   */
  async startBatchCalculation(batchConfig) {
    const response = await fetch(`${API_BASE}/start-batch-calculation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batch_config: batchConfig,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `API error: ${response.status} - ${
          errorData.errors?.join(", ") || "Unknown error"
        }`
      );
    }

    return response.json();
  }

  /**
   * Get single task status
   */
  async getTaskStatus(taskId) {
    const response = await fetch(`${API_BASE}/task-status/${taskId}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get batch status
   */
  async getBatchStatus(taskId) {
    const response = await fetch(`${API_BASE}/batch-status/${taskId}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get batch results
   */
  async getBatchResults(taskId) {
    const response = await fetch(`${API_BASE}/batch-results/${taskId}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Cancel a running task (works for both single and batch)
   */
  async cancelTask(taskId) {
    const response = await fetch(`${API_BASE}/cancel/${taskId}`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Download plot data (works for both single and batch)
   */
  async downloadPlotData(taskId, format = "json") {
    const response = await fetch(
      `${API_BASE}/plots/${taskId}/download?format=${format}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.blob();
  }

  /**
   * Get plot snapshot
   */
  async getPlotSnapshot(taskId) {
    const response = await fetch(`${API_BASE}/plots/${taskId}/snapshot`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Send acknowledgment for a message (used internally by SSE hook)
   */
  async sendAcknowledgment(taskId, messageId) {
    const response = await fetch(`${API_BASE}/ack/${taskId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message_id: messageId,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Check acknowledgment status (for debugging)
   */
  async checkAcknowledgmentStatus(taskId, messageId) {
    const response = await fetch(
      `${API_BASE}/ack-status/${taskId}/${messageId}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Health check
   */
  async healthCheck() {
    const response = await fetch(`${API_BASE.replace("/api", "")}/health`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }
}

export default new APIService();
