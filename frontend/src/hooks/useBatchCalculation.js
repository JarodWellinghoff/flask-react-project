// src/hooks/useBatchCalculation.js
import { useState, useCallback, useRef, useEffect } from "react";
import apiService from "../services/api";

/**
 * Hook for managing batch calculation lifecycle
 */
export function useBatchCalculation() {
  const [taskId, setTaskId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isBatchMode, setIsBatchMode] = useState(false);

  // Batch-specific state
  const [totalTests, setTotalTests] = useState(0);
  const [completedTests, setCompletedTests] = useState(0);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [currentTestProgress, setCurrentTestProgress] = useState(0);
  const [testResults, setTestResults] = useState([]);
  const [batchSummary, setBatchSummary] = useState(null);

  const startTimeRef = useRef(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const startSingleCalculation = useCallback(
    async (numIterations, testParams) => {
      try {
        setIsRunning(true);
        setIsBatchMode(false);
        setError(null);
        setBatchProgress(0);
        setTestResults([]);
        setBatchSummary(null);
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
    },
    []
  );

  const startBatchCalculation = useCallback(async (batchConfig) => {
    try {
      setIsRunning(true);
      setIsBatchMode(true);
      setError(null);
      setBatchProgress(0);
      setCurrentTestProgress(0);
      setTestResults([]);
      setBatchSummary(null);
      startTimeRef.current = Date.now();

      // Set batch metadata
      setTotalTests(batchConfig.tests.length);
      setCompletedTests(0);
      setCurrentTestIndex(0);

      const response = await apiService.startBatchCalculation(batchConfig);
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
      setBatchProgress(0);
      setCurrentTestProgress(0);
    } catch (err) {
      setError(err.message);
    }
  }, [taskId]);

  const updateSingleProgress = useCallback((newProgress) => {
    setBatchProgress(newProgress);
  }, []);

  const updateBatchProgress = useCallback((data) => {
    if (data.batch_progress !== undefined) {
      setBatchProgress(data.batch_progress);
    }
    if (data.completed_tests !== undefined) {
      setCompletedTests(data.completed_tests);
    }
    if (data.current_test_index !== undefined) {
      setCurrentTestIndex(data.current_test_index);
    }
    if (data.test_progress !== undefined) {
      setCurrentTestProgress(data.test_progress);
    }
  }, []);

  const addTestResult = useCallback((testResult) => {
    setTestResults((prev) => {
      // Ensure we don't duplicate results
      const existingIndex = prev.findIndex(
        (r) => r.test_index === testResult.test_index
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = testResult;
        return updated;
      }
      return [...prev, testResult];
    });
  }, []);

  const completeCalculation = useCallback(
    (summary) => {
      setIsRunning(false);
      setBatchProgress(100);
      setCurrentTestProgress(100);

      if (isBatchMode) {
        setBatchSummary(summary);
      }

      setTimeout(() => setTaskId(null), 2000);
    },
    [isBatchMode]
  );

  const downloadResults = useCallback(
    async (format = "json") => {
      if (!taskId) return;

      try {
        const blob = await apiService.downloadPlotData(taskId, format);

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${
          isBatchMode ? "batch_" : ""
        }results_${taskId}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        setError(err.message);
      }
    },
    [taskId, isBatchMode]
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
    // Common state
    taskId,
    isRunning,
    error,
    elapsedTime,

    // Mode state
    isBatchMode,

    // Single calculation state
    singleProgress: batchProgress,

    // Batch calculation state
    batchProgress,
    totalTests,
    completedTests,
    currentTestIndex,
    currentTestProgress,
    testResults,
    batchSummary,

    // Actions
    startSingleCalculation,
    startBatchCalculation,
    cancelCalculation,
    updateSingleProgress,
    updateBatchProgress,
    addTestResult,
    completeCalculation,
    downloadResults,
  };
}
