// src/hooks/useCalculation.js
import { useState, useCallback, useRef, useEffect } from "react";
import apiService from "../services/api";

/**
 * Hook for managing calculation lifecycle
 */
export function useCalculation() {
  const [taskId, setTaskId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const startTimeRef = useRef(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const startCalculation = useCallback(async (numIterations, testParams) => {
    try {
      setIsRunning(true);
      setError(null);
      setProgress(0);
      setResults(null);
      startTimeRef.current = Date.now();

      const response = await apiService.startCalculation(
        numIterations,
        testParams
      );
      setTaskId(response.task_id);

      return response.task_id;
    } catch (err) {
      setError(err.message);
      setIsRunning(false);
      throw err;
    }
  }, []);

  const cancelCalculation = useCallback(async () => {
    if (!taskId) return;

    try {
      await apiService.cancelTask(taskId);
      setIsRunning(false);
      setProgress(0);
    } catch (err) {
      setError(err.message);
    }
  }, [taskId]);

  const updateProgress = useCallback((newProgress) => {
    setProgress(newProgress);
  }, []);

  const completeCalculation = useCallback((summary) => {
    setIsRunning(false);
    setProgress(100);
    setResults(summary);
    setTimeout(() => setTaskId(null), 1000);
  }, []);

  const downloadResults = useCallback(
    async (format = "json") => {
      if (!taskId) return;

      try {
        const blob = await apiService.downloadPlotData(taskId, format);

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `results_${taskId}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        setError(err.message);
      }
    },
    [taskId]
  );

  // Update elapsed time
  useEffect(() => {
    let interval;
    if (isRunning && startTimeRef.current) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  return {
    taskId,
    isRunning,
    progress,
    error,
    results,
    elapsedTime,
    startCalculation,
    cancelCalculation,
    updateProgress,
    completeCalculation,
    downloadResults,
  };
}
