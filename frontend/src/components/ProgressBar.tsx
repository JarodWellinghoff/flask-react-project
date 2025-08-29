// src/components/ProgressBar/ProgressBar.tsx
import React from "react";
import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Box,
  Grid,
  Chip,
  Paper,
  Stack,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { DataTransformService } from "../services/dataTransform";
import { formatDuration } from "../utils/formatters";

interface ProgressBarProps {
  // Single mode props
  progress?: number;
  elapsedTime?: number;
  messageCount?: number;
  dataTransferred?: number;

  // Batch mode props
  isBatchMode?: boolean;
  batchProgress?: number;
  totalTests?: number;
  completedTests?: number;
  currentTestIndex?: number;
  currentTestProgress?: number;
  currentTestName?: string;
}

export function ProgressBar({
  // Single mode props
  progress = 0,
  elapsedTime = 0,
  messageCount = 0,
  dataTransferred = 0,

  // Batch mode props
  isBatchMode = false,
  batchProgress = 0,
  totalTests = 0,
  completedTests = 0,
  currentTestIndex = 0,
  currentTestProgress = 0,
  currentTestName = "",
}: ProgressBarProps) {
  const displayProgress = isBatchMode ? batchProgress : progress;
  const showCurrentTest = isBatchMode && totalTests > 1;

  const getTestStatus = (
    testIndex: number,
    completedTests: number,
    currentTestIndex: number
  ) => {
    if (testIndex < completedTests) {
      return "completed";
    } else if (testIndex === currentTestIndex) {
      return "running";
    } else {
      return "pending";
    }
  };

  const getTestStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "running":
        return "primary";
      case "pending":
        return "default";
      default:
        return "default";
    }
  };

  const getTestStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon fontSize='small' />;
      case "running":
        return <PlayArrowIcon fontSize='small' />;
      case "pending":
        return <ScheduleIcon fontSize='small' />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent>
        {/* Main Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant='h6' component='div'>
              {isBatchMode
                ? `Batch Progress (${completedTests}/${totalTests} tests completed)`
                : "Calculation Progress"}
            </Typography>
            <Typography variant='h6' component='div' color='primary'>
              {displayProgress}%
            </Typography>
          </Box>
          <LinearProgress
            variant='determinate'
            value={displayProgress}
            sx={{ height: 12, borderRadius: 1 }}
          />
        </Box>

        {/* Current Test Progress (Batch Mode Only) */}
        {showCurrentTest && (
          <Paper
            variant='outlined'
            sx={{
              p: 2,
              mb: 3,
              bgcolor: "primary.50",
              borderColor: "primary.200",
            }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography
                variant='subtitle1'
                sx={{ fontWeight: 600, color: "primary.700" }}>
                Current: {currentTestName || `Test ${currentTestIndex + 1}`}
              </Typography>
              <Typography
                variant='subtitle1'
                sx={{ fontWeight: 600, color: "success.600" }}>
                {currentTestProgress}%
              </Typography>
            </Box>
            <LinearProgress
              variant='determinate'
              value={currentTestProgress}
              color='success'
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Paper>
        )}

        {/* Statistics Grid */}
        <Grid
          container
          spacing={2}
          sx={{ mb: 3, justifyContent: "space-evenly" }}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant='caption'
                color='text.secondary'
                display='block'>
                Elapsed
              </Typography>
              <Typography variant='h6' component='div'>
                {formatDuration(elapsedTime)}
              </Typography>
            </Box>
          </Grid>

          {isBatchMode ? (
            <>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    display='block'>
                    Completed Tests
                  </Typography>
                  <Typography variant='h6' component='div'>
                    {completedTests}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    display='block'>
                    Remaining Tests
                  </Typography>
                  <Typography variant='h6' component='div'>
                    {totalTests - completedTests}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    display='block'>
                    Current Test
                  </Typography>
                  <Typography variant='h6' component='div'>
                    {currentTestIndex + 1}
                  </Typography>
                </Box>
              </Grid>
            </>
          ) : (
            <>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    display='block'>
                    Messages
                  </Typography>
                  <Typography variant='h6' component='div'>
                    {messageCount}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    display='block'>
                    Data Transferred
                  </Typography>
                  <Typography variant='h6' component='div'>
                    {DataTransformService.formatBytes(dataTransferred)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    display='block'>
                    Efficiency
                  </Typography>
                  <Typography variant='h6' component='div'>
                    {messageCount > 0
                      ? `${(dataTransferred / messageCount).toFixed(
                          0
                        )} bytes/msg`
                      : "0 bytes/msg"}
                  </Typography>
                </Box>
              </Grid>
            </>
          )}
        </Grid>

        {/* Test Queue Visualization (Batch Mode Only) */}
        {isBatchMode && totalTests > 1 && (
          <Box>
            <Typography variant='subtitle2' sx={{ mb: 2, fontWeight: 600 }}>
              Test Queue
            </Typography>
            <Stack
              direction='row'
              spacing={1}
              sx={{
                overflowX: "auto",
                pb: 1,
                "&::-webkit-scrollbar": {
                  height: 4,
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "grey.200",
                  borderRadius: 2,
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "grey.400",
                  borderRadius: 2,
                },
              }}>
              {Array(totalTests)
                .fill(0)
                .map((_, index) => {
                  const status = getTestStatus(
                    index,
                    completedTests,
                    currentTestIndex
                  );
                  return (
                    <Box
                      key={index}
                      sx={{
                        minWidth: 80,
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 0.5,
                      }}>
                      <Chip
                        label={index + 1}
                        size='medium'
                        color={getTestStatusColor(status) as any}
                        variant={status === "running" ? "filled" : "outlined"}
                        icon={getTestStatusIcon(status)}
                        sx={{
                          minWidth: 60,
                          animation:
                            status === "running" ? "pulse 2s infinite" : "none",
                          "@keyframes pulse": {
                            "0%, 100%": { opacity: 1 },
                            "50%": { opacity: 0.7 },
                          },
                        }}
                      />
                      <Typography variant='caption' color='text.secondary'>
                        {status === "completed"
                          ? "Done"
                          : status === "running"
                          ? "Running"
                          : "Waiting"}
                      </Typography>
                    </Box>
                  );
                })}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
