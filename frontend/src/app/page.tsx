"use client";
import React, { useEffect, useState, Suspense } from "react";
import { ControlPanel } from "@/src/components/ControlPanel/ControlPanel";
import { ProgressBar } from "@/src/components/ProgressBar/ProgressBar";
import { PlotGrid } from "@/src/components/PlotGrid/PlotGrid";
import { ResultsSummary } from "@/src/components/ResultsSummary/ResultsSummary";
import { ErrorBoundary } from "@/src/components/ErrorBoundary/ErrorBoundary";
import { useCalculation } from "@/src/hooks/useCalculation";
import { usePlotData } from "@/src/hooks/usePlotData";
import { useSSE } from "@/src/hooks/useSSE";

// Define the possible message types
type SSEMessage =
  | {
      type: "plot_update";
      iteration: number;
      plots: any;
      progress: number;
      total_iterations: number;
    }
  | {
      type: "calculation_complete";
      task_id: string;
      summary: any;
      complete_plots?: any;
    }
  | { type: "current_state"; state: any }
  | { type: "error"; error: any }
  | { type: "connected"; task_id: string }
  | { type: "timeout" }
  | { type: "cancelled" }
  | { type: string; [key: string]: any }; // fallback for unknown types

function DashboardContent() {
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
    resetPlotData,
    setFinalStats,
    setCompletePlotData, // New function to set all plots at once
  } = usePlotData();

  const [dataTransferred, setDataTransferred] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  const {
    lastMessage,
    connectionState,
    error: sseError,
  } = useSSE(taskId) as {
    lastMessage: SSEMessage | null;
    connectionState: any;
    error: any;
  };

  // Handle SSE messages
  useEffect(() => {
    if (!lastMessage) return;

    // Track data transfer
    const bytes = new Blob([JSON.stringify(lastMessage)]).size;
    setDataTransferred((prev) => prev + bytes);
    setMessageCount((prev) => prev + 1);

    // Handle different message types
    console.log("SSE Message:", lastMessage);
    switch (lastMessage.type) {
      case "plot_update":
        // Only update progress, not plots
        updateProgress(lastMessage.progress);
        break;

      case "calculation_complete":
        completeCalculation(lastMessage.summary);
        setFinalStats(lastMessage.summary);

        // Update all plots at once with complete data
        if (lastMessage.complete_plots) {
          setCompletePlotData(lastMessage.complete_plots);
        }
        break;

      case "current_state":
        updateProgress(lastMessage.state.progress);
        break;

      case "timeout":
        console.warn("SSE Timeout");
        break;

      case "error":
        console.error("Calculation error:", lastMessage.error);
        break;

      case "connected":
        console.log("SSE Connected:", lastMessage.task_id);
        break;

      case "cancelled":
        console.log("Calculation cancelled");
        break;

      default:
        console.log("Unknown message type:", lastMessage.type);
    }
  }, [
    lastMessage,
    updateProgress,
    completeCalculation,
    setFinalStats,
    setCompletePlotData,
  ]);

  const handleStart = async (numIterations: number, testParams: any) => {
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
        {taskId && connectionState !== "CLOSED" && (
          <div className='app__connection-status'>
            SSE Status:{" "}
            <span className={`status status--${connectionState.toLowerCase()}`}>
              {connectionState}
            </span>
          </div>
        )}

        {/* Show message during calculation */}
        {isRunning && (
          <div className='app__section'>
            <div
              style={{
                padding: "1rem",
                textAlign: "center",
                backgroundColor: "#f0f9ff",
                borderRadius: "0.5rem",
                color: "#0369a1",
              }}>
              Calculation in progress... Plots will be displayed when complete.
            </div>
          </div>
        )}

        {/* Plot Grid - Only show when calculation is complete */}
        {!isRunning &&
          (convergenceData.length > 0 ||
            accuracyData.length > 0 ||
            performanceData.length > 0) && (
            <div className='app__section'>
              <Suspense fallback={<div>Loading plots...</div>}>
                <PlotGrid
                  convergenceData={convergenceData}
                  accuracyData={accuracyData}
                  performanceData={performanceData}
                  errorDistribution={errorDistribution}
                  plotStats={plotStats}
                />
              </Suspense>
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

export default function Home() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}
