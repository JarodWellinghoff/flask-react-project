// frontend/src/hooks/__tests__/useCalculation.test.js
import { renderHook, act } from "@testing-library/react";
import { useCalculation } from "../useCalculation";

jest.mock("../../services/api");

describe("useCalculation", () => {
  test("initializes with correct default state", () => {
    const { result } = renderHook(() => useCalculation());

    expect(result.current.taskId).toBeNull();
    expect(result.current.isRunning).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBeNull();
  });

  test("startCalculation updates state", async () => {
    const { result } = renderHook(() => useCalculation());

    await act(async () => {
      await result.current.startCalculation(10, { seed: 42 });
    });

    expect(result.current.isRunning).toBe(true);
  });
});
