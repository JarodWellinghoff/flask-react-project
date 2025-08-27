// src/services/api.js
/**
 * API service for backend communication
 */
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

class APIService {
  /**
   * Start a new calculation
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
   * Get task status
   */
  async getTaskStatus(taskId) {
    const response = await fetch(`${API_BASE}/task-status/${taskId}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Cancel a running task
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
   * Download plot data
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
}

export default new APIService();
