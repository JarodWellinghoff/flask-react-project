// src/App.jsx
import React, { useEffect, useState } from "react";
import { ControlPanel } from "./components/ControlPanel/ControlPanel";
import { ProgressBar } from "./components/ProgressBar/ProgressBar";
import { PlotGrid } from "./components/PlotGrid/PlotGrid";
import { ResultsSummary } from "./components/ResultsSummary/ResultsSummary";
import { useCalculation } from "./hooks/useCalculation";
import { usePlotData } from "./hooks/usePlotData";
import { useSSE } from "./hooks/useSSE";
import "./App.css";

function App() {
  const {
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
  } = useCalculation();

  const {
    convergenceData,
    accuracyData,
    performanceData,
    errorDistribution,
    plotStats,
    updatePlotData,
    resetPlotData,
    setFinalStats,
  } = usePlotData();

  const [dataTransferred, setDataTransferred] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  const { lastMessage, connectionState, error: sseError } = useSSE(taskId);

  // Handle SSE messages
  useEffect(() => {
    if (!lastMessage) return;

    // Track data transfer
    const bytes = new Blob([JSON.stringify(lastMessage)]).size;
    setDataTransferred((prev) => prev + bytes);
    setMessageCount((prev) => prev + 1);

    // Handle different message types
    switch (lastMessage.type) {
      case "plot_update":
        updateProgress(lastMessage.progress);
        updatePlotData(lastMessage.plots);
        break;

      case "calculation_complete":
        completeCalculation(lastMessage.summary);
        setFinalStats(lastMessage.summary);
        break;

      case "error":
        console.error("Calculation error:", lastMessage.error);
        break;

      default:
        console.log("Unknown message type:", lastMessage.type);
    }
  }, [
    lastMessage,
    updateProgress,
    updatePlotData,
    completeCalculation,
    setFinalStats,
  ]);

  const handleStart = async (numIterations, testParams) => {
    // Reset state
    setDataTransferred(0);
    setMessageCount(0);
    resetPlotData();

    // Start calculation
    await startCalculation(numIterations, testParams);
  };

  return (
    <div className='app'>
      <div className='app__container'>
        <h1 className='app__title'>Real-time Calculation Dashboard</h1>

        {/* Control Panel */}
        <div className='app__section'>
          <ControlPanel
            onStart={handleStart}
            onCancel={cancelCalculation}
            onDownload={downloadResults}
            isRunning={isRunning}
            taskId={taskId}
          />
        </div>

        {/* Progress Bar */}
        {(isRunning || progress > 0) && (
          <div className='app__section'>
            <ProgressBar
              progress={progress}
              elapsedTime={elapsedTime}
              messageCount={messageCount}
              dataTransferred={dataTransferred}
            />
          </div>
        )}

        {/* Error Display */}
        {(error || sseError) && (
          <div className='app__error'>Error: {error || sseError}</div>
        )}

        {/* SSE Connection Status */}
        {taskId && (
          <div className='app__connection-status'>
            SSE Status:{" "}
            <span className={`status status--${connectionState.toLowerCase()}`}>
              {connectionState}
            </span>
          </div>
        )}

        {/* Plot Grid */}
        {(convergenceData.length > 0 ||
          accuracyData.length > 0 ||
          performanceData.length > 0) && (
          <div className='app__section'>
            <PlotGrid
              convergenceData={convergenceData}
              accuracyData={accuracyData}
              performanceData={performanceData}
              errorDistribution={errorDistribution}
              plotStats={plotStats}
            />
          </div>
        )}

        {/* Results Summary */}
        {results && (
          <div className='app__section'>
            <ResultsSummary summary={results} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
