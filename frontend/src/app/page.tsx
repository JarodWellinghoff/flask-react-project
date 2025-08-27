// src/app/page.tsx - Updated for batch calculations
"use client";
import React, { useEffect, useState, Suspense } from "react";
import { BatchControlPanel } from "@/src/components/ControlPanel/BatchControlPanel";
import { BatchProgressBar } from "@/src/components/ProgressBar/BatchProgressBar";
import { PlotGrid } from "@/src/components/PlotGrid/PlotGrid";
import { BatchResultsDisplay } from "@/src/components/BatchResults/BatchResultsDisplay";
import { ResultsSummary } from "@/src/components/ResultsSummary/ResultsSummary";
import { ErrorBoundary } from "@/src/components/ErrorBoundary/ErrorBoundary";
import { useBatchCalculation } from "@/src/hooks/useBatchCalculation";
import { usePlotData } from "@/src/hooks/usePlotData";
import { useBatchSSE } from "@/src/hooks/useBatchSSE";

// Define the possible message types for batch operations
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
  | { type: "batch_started"; task_id: string; total_tests: number }
  | {
      type: "test_started";
      test_index: number;
      test_name: string;
      test_config: any;
    }
  | {
      type: "test_iteration_update";
      test_index: number;
      iteration: number;
      total_iterations: number;
      test_progress: number;
    }
  | {
      type: "test_completed";
      test_index: number;
      test_name: string;
      test_result: any;
      batch_progress: number;
    }
  | {
      type: "batch_completed";
      task_id: string;
      batch_summary: any;
      total_tests: number;
    }
  | { type: "current_state"; state: any }
  | { type: "error"; error: any }
  | { type: "batch_error"; error: any }
  | { type: "connected"; task_id: string }
  | { type: "timeout" }
  | { type: "cancelled" }
  | { type: string; [key: string]: any };

function DashboardContent() {
  const {
    // Common state
    taskId,
    isRunning,
    error,
    elapsedTime,

    // Mode state
    isBatchMode,

    // Single calculation state
    singleProgress,

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
  } = useBatchCalculation();

  const {
    convergenceData,
    accuracyData,
    performanceData,
    errorDistribution,
    plotStats,
    resetPlotData,
    setFinalStats,
    setCompletePlotData,
  } = usePlotData();

  const [dataTransferred, setDataTransferred] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [currentTestName, setCurrentTestName] = useState("");

  const {
    lastMessage,
    connectionState,
    error: sseError,
  } = useBatchSSE(taskId, isBatchMode) as {
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

    console.log("SSE Message:", lastMessage);

    switch (lastMessage.type) {
      // Single calculation messages
      case "plot_update":
        updateSingleProgress(lastMessage.progress);
        break;

      case "calculation_complete":
        completeCalculation(lastMessage.summary);
        setFinalStats(lastMessage.summary);
        if (lastMessage.complete_plots) {
          setCompletePlotData(lastMessage.complete_plots);
        }
        break;

      // Batch calculation messages
      case "batch_started":
        console.log(`Batch started with ${lastMessage.total_tests} tests`);
        break;

      case "test_started":
        setCurrentTestName(lastMessage.test_name);
        updateBatchProgress({
          current_test_index: lastMessage.test_index,
          test_progress: 0,
        });
        break;

      case "test_iteration_update":
        updateBatchProgress({
          current_test_index: lastMessage.test_index,
          test_progress: lastMessage.test_progress,
        });
        break;

      case "test_completed":
        // Add the completed test result
        console.log(lastMessage.test_result);
        addTestResult(lastMessage.test_result);

        // Update batch progress
        updateBatchProgress({
          batch_progress: lastMessage.batch_progress,
          completed_tests: lastMessage.test_index + 1,
        });
        break;

      case "batch_completed":
        completeCalculation(lastMessage.batch_summary);
        break;

      // Common messages
      case "current_state":
        if (isBatchMode) {
          updateBatchProgress(lastMessage.state);
        } else {
          updateSingleProgress(lastMessage.state.progress);
        }
        break;

      case "timeout":
        console.warn("SSE Timeout");
        break;

      case "error":
      case "batch_error":
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
    updateSingleProgress,
    updateBatchProgress,
    addTestResult,
    completeCalculation,
    setFinalStats,
    setCompletePlotData,
    isBatchMode,
  ]);

  const handleStartSingle = async (numIterations: number, testParams: any) => {
    // Reset state
    setDataTransferred(0);
    setMessageCount(0);
    setCurrentTestName("");
    resetPlotData();

    // Start calculation
    await startSingleCalculation(numIterations, testParams);
  };

  const handleStartBatch = async (batchConfig: any) => {
    // Reset state
    setDataTransferred(0);
    setMessageCount(0);
    setCurrentTestName("");
    resetPlotData();

    // Start batch calculation
    await startBatchCalculation(batchConfig);
  };

  return (
    <div className='app'>
      <div className='app__container'>
        <h1 className='app__title'>
          Real-time {isBatchMode ? "Batch " : ""}Calculation Dashboard
        </h1>

        {/* Enhanced Control Panel */}
        <div className='app__section'>
          <BatchControlPanel
            onStartSingle={handleStartSingle}
            onStartBatch={handleStartBatch}
            onCancel={cancelCalculation}
            onDownload={downloadResults}
            isRunning={isRunning}
            taskId={taskId}
            isBatchMode={isBatchMode}
          />
        </div>

        {/* Enhanced Progress Bar */}
        {(isRunning || singleProgress > 0 || batchProgress > 0) && (
          <div className='app__section'>
            <BatchProgressBar
              // Single mode props
              progress={singleProgress}
              elapsedTime={elapsedTime}
              messageCount={messageCount}
              dataTransferred={dataTransferred}
              // Batch mode props
              isBatchMode={isBatchMode}
              batchProgress={batchProgress}
              totalTests={totalTests}
              completedTests={completedTests}
              currentTestIndex={currentTestIndex}
              currentTestProgress={currentTestProgress}
              currentTestName={currentTestName}
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

        {/* Running Status Message */}
        {isRunning && (
          <div className='app__section'>
            <div className='app__status-message'>
              {isBatchMode
                ? `Running batch calculation... Test ${
                    currentTestIndex + 1
                  } of ${totalTests} (${
                    currentTestName || `Test ${currentTestIndex + 1}`
                  }) - Results will be displayed as each test completes.`
                : "Calculation in progress... Plots will be displayed when complete."}
            </div>
          </div>
        )}

        {/* Batch Results Display */}
        {isBatchMode && testResults.length > 0 && (
          <div className='app__section'>
            <BatchResultsDisplay
              testResults={testResults}
              batchSummary={batchSummary}
              completedTests={completedTests}
              totalTests={totalTests}
            />
          </div>
        )}

        {/* Single Calculation Results */}
        {!isBatchMode && !isRunning && (
          <>
            {/* Plot Grid - Only show when calculation is complete */}
            {(convergenceData.length > 0 ||
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

            {/* Single Results Summary */}
            {plotStats.summary && (
              <div className='app__section'>
                <ResultsSummary summary={plotStats.summary} />
              </div>
            )}
          </>
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
