// src/app/page.tsx - Updated for MUI with batch calculations
"use client";
import React, { useEffect, useState, Suspense } from "react";
import {
  Container,
  Typography,
  Box,
  Stack,
  Alert,
  Chip,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material";
import {
  Cloud as CloudIcon,
  CloudOff as CloudOffIcon,
  Sync as SyncIcon,
} from "@mui/icons-material";
import { ControlPanel } from "@/src/components/ControlPanel";
import { ProgressBar } from "@/src/components/ProgressBar";
import { PlotGrid } from "@/src/components/PlotGrid";
import { BatchResultsDisplay } from "@/src/components/BatchResultsDisplay";
import { ResultsSummary } from "@/src/components/ResultsSummary";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { useCalculation } from "@/src/hooks/useCalculation";
import { usePlotData } from "@/src/hooks/usePlotData";
import { useSSE } from "@/src/hooks/useSSE";
import { AcknowledgmentMonitor } from "@/src/components/AcknowledgmentMonitor";
import { DEV_CONFIG } from "@/src/utils/constants";

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
  | {
      type: "batch_started";
      task_id: string;
      total_tests: number;
    }
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
  | {
      type: "current_state";
      state: any;
    }
  | {
      type: "error";
      error: any;
    }
  | {
      type: "batch_error";
      error: any;
    }
  | {
      type: "connected";
      task_id: string;
    }
  | {
      type: "timeout";
    }
  | {
      type: "cancelled";
    }
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
  } = useCalculation();

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
  } = useSSE(taskId, isBatchMode) as {
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
        addTestResult(lastMessage.test_result);
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
    setDataTransferred(0);
    setMessageCount(0);
    setCurrentTestName("");
    resetPlotData();
    await startSingleCalculation(numIterations, testParams);
  };

  const handleStartBatch = async (batchConfig: any) => {
    setDataTransferred(0);
    setMessageCount(0);
    setCurrentTestName("");
    resetPlotData();
    await startBatchCalculation(batchConfig);
  };

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case "OPEN":
        return "success";
      case "CONNECTING":
        return "warning";
      case "CLOSED":
        return "default";
      default:
        return "error";
    }
  };

  const getConnectionIcon = () => {
    switch (connectionState) {
      case "OPEN":
        return <CloudIcon fontSize='small' />;
      case "CONNECTING":
        return (
          <SyncIcon
            fontSize='small'
            sx={{ animation: "spin 1s linear infinite" }}
          />
        );
      default:
        return <CloudOffIcon fontSize='small' />;
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}>
      {DEV_CONFIG.ENABLE_ACKNOWLEDGMENTS && (
        <AcknowledgmentMonitor taskId={taskId} isVisible={true} />
      )}

      <Container maxWidth='xl'>
        <Stack spacing={3}>
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Typography
              variant='h3'
              component='h1'
              sx={{
                fontWeight: 700,
                color: "text.primary",
                mb: 1,
              }}>
              Real-time {isBatchMode ? "Batch " : ""}Calculation Dashboard
            </Typography>

            {/* SSE Connection Status */}
            {taskId && connectionState !== "CLOSED" && (
              <Chip
                icon={getConnectionIcon()}
                label={`SSE Status: ${connectionState}`}
                color={getConnectionStatusColor() as any}
                variant='outlined'
                size='small'
                sx={{
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              />
            )}
          </Box>

          {/* Enhanced Control Panel */}
          <ControlPanel
            onStartSingle={handleStartSingle}
            onStartBatch={handleStartBatch}
            onCancel={cancelCalculation}
            onDownload={downloadResults}
            isRunning={isRunning}
            taskId={taskId}
            isBatchMode={isBatchMode}
          />

          {/* Enhanced Progress Bar */}
          {(isRunning || singleProgress > 0 || batchProgress > 0) && (
            <ProgressBar
              progress={singleProgress}
              elapsedTime={elapsedTime}
              messageCount={messageCount}
              dataTransferred={dataTransferred}
              isBatchMode={isBatchMode}
              batchProgress={batchProgress}
              totalTests={totalTests}
              completedTests={completedTests}
              currentTestIndex={currentTestIndex}
              currentTestProgress={currentTestProgress}
              currentTestName={currentTestName}
            />
          )}

          {/* Error Display */}
          {(error || sseError) && (
            <Alert severity='error' sx={{ mb: 2 }}>
              <Typography variant='body2'>
                <strong>Error:</strong> {error || sseError}
              </Typography>
            </Alert>
          )}

          {/* Running Status Message */}
          {isRunning && (
            <Alert severity='info' sx={{ mb: 2 }}>
              <Typography variant='body2'>
                {isBatchMode
                  ? `Running batch calculation... Test ${
                      currentTestIndex + 1
                    } of ${totalTests} (${
                      currentTestName || `Test ${currentTestIndex + 1}`
                    }) - Results will be displayed as each test completes.`
                  : "Calculation in progress... Plots will be displayed when complete."}
              </Typography>
            </Alert>
          )}

          {/* Batch Results Display */}
          {isBatchMode && testResults.length > 0 && (
            <BatchResultsDisplay
              testResults={testResults}
              batchSummary={batchSummary}
              completedTests={completedTests}
              totalTests={totalTests}
            />
          )}

          {/* Single Calculation Results */}
          {!isBatchMode && !isRunning && (
            <Stack spacing={3}>
              {/* Plot Grid - Only show when calculation is complete */}
              {(convergenceData.length > 0 ||
                accuracyData.length > 0 ||
                performanceData.length > 0) && (
                <Suspense
                  fallback={
                    <Card>
                      <CardContent sx={{ textAlign: "center", py: 4 }}>
                        <CircularProgress sx={{ mb: 2 }} />
                        <Typography variant='body2' color='text.secondary'>
                          Loading plots...
                        </Typography>
                      </CardContent>
                    </Card>
                  }>
                  <PlotGrid
                    convergenceData={convergenceData}
                    accuracyData={accuracyData}
                    performanceData={performanceData}
                    errorDistribution={errorDistribution}
                    plotStats={plotStats}
                  />
                </Suspense>
              )}

              {/* Single Results Summary */}
              {plotStats.summary && (
                <ResultsSummary summary={plotStats.summary} />
              )}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}
