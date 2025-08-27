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

  const updatePlotData = useCallback((plotUpdate) => {
    // Update convergence plot
    if (plotUpdate.convergence) {
      if (plotUpdate.convergence.full_data) {
        setConvergenceData(plotUpdate.convergence.full_data);
      } else if (plotUpdate.convergence.new_point) {
        setConvergenceData((prev) => [
          ...prev,
          plotUpdate.convergence.new_point,
        ]);
      }
    }

    // Update accuracy plot
    if (plotUpdate.accuracy) {
      if (plotUpdate.accuracy.full_data) {
        setAccuracyData(plotUpdate.accuracy.full_data);
      } else if (plotUpdate.accuracy.new_point) {
        setAccuracyData((prev) => [...prev, plotUpdate.accuracy.new_point]);
      }
    }

    // Update performance plot
    if (plotUpdate.performance) {
      if (plotUpdate.performance.full_data) {
        setPerformanceData(plotUpdate.performance.full_data);
      } else if (plotUpdate.performance.new_point) {
        setPerformanceData((prev) => {
          const newData = [...prev, plotUpdate.performance.new_point];
          // Keep only last 20 points for performance
          return newData.slice(-20);
        });
      }
    }

    // Update error distribution
    if (plotUpdate.error_distribution) {
      const histData = DataTransformService.createHistogram(
        plotUpdate.error_distribution.data,
        20
      );
      setErrorDistribution(histData);

      if (plotUpdate.error_distribution.stats) {
        setPlotStats((prev) => ({
          ...prev,
          errorStats: plotUpdate.error_distribution.stats,
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
    updatePlotData,
    resetPlotData,
    setFinalStats,
  };
}
