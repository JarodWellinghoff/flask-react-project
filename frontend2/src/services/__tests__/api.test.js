// frontend/src/services/__tests__/api.test.js
import apiService from "../api";

// Mock fetch
global.fetch = jest.fn();

beforeEach(() => {
  fetch.mockClear();
});

describe("APIService", () => {
  test("startCalculation sends correct request", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ task_id: "123", stream_url: "/stream/123" }),
    });

    const result = await apiService.startCalculation(10, { seed: 42 });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/start-calculation"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          num_iterations: 10,
          test_params: { seed: 42 },
        }),
      })
    );

    expect(result).toHaveProperty("task_id", "123");
  });

  test("handles API errors", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(apiService.startCalculation(10)).rejects.toThrow(
      "API error: 500"
    );
  });
});
