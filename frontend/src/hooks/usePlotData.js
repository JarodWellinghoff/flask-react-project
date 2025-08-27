// src/hooks/usePlotData.js
import { useState, useCallback } from "react";
import { DataTransformService } from "../services/dataTransform";

/**
 * Hook for managing plot data
 */
export function usePlotData() {
  const [convergenceData, setConvergenceData] = useState([]);
  const [accuracyData, setAccuracyData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [errorDistribution, setErrorDistribution] = useState([]);
  const [plotStats, setPlotStats] = useState({});

  // New function to set all plot data at once when calculation is complete
  const setCompletePlotData = useCallback((completePlots) => {
    console.log("Setting complete plot data:", completePlots);

    // Set convergence data
    if (completePlots.convergence) {
      setConvergenceData(completePlots.convergence);
    }

    // Set accuracy data
    if (completePlots.accuracy) {
      setAccuracyData(completePlots.accuracy);
    }

    // Set performance data
    if (completePlots.performance) {
      setPerformanceData(completePlots.performance);
    }

    // Generate error distribution from the last iteration if available
    if (completePlots.error_distribution) {
      const histData = DataTransformService.createHistogram(
        completePlots.error_distribution.data,
        20
      );
      setErrorDistribution(histData);

      if (completePlots.error_distribution.stats) {
        setPlotStats((prev) => ({
          ...prev,
          errorStats: completePlots.error_distribution.stats,
        }));
      }
    }
  }, []);

  const resetPlotData = useCallback(() => {
    setConvergenceData([]);
    setAccuracyData([]);
    setPerformanceData([]);
    setErrorDistribution([]);
    setPlotStats({});
  }, []);

  const setFinalStats = useCallback((summary) => {
    setPlotStats((prev) => ({
      ...prev,
      summary,
    }));
  }, []);

  return {
    convergenceData,
    accuracyData,
    performanceData,
    errorDistribution,
    plotStats,
    resetPlotData,
    setFinalStats,
    setCompletePlotData, // New function
  };
}
