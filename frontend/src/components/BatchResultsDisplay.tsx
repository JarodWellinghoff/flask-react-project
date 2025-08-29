// src/components/BatchResults/BatchResultsDisplay.tsx
import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Paper,
  Tabs,
  Tab,
  Chip,
  Stack,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
} from "@mui/icons-material";
import { PlotGrid } from "./PlotGrid";
import { ResultsSummary } from "./ResultsSummary";

interface TestResult {
  test_index: number;
  test_name: string;
  test_config: any;
  final_metrics: {
    final_accuracy: number;
    final_loss: number;
    avg_throughput: number;
  };
  complete_plots: {
    convergence: any[];
    accuracy: any[];
    performance: any[];
    error_distribution?: {
      data: any[];
      stats: any;
    };
  };
}

interface BatchSummary {
  total_tests: number;
  best_final_accuracy: number;
  worst_final_accuracy: number;
  avg_final_accuracy: number;
  best_final_loss: number;
  avg_throughput: number;
  best_performing_test: string;
  worst_performing_test: string;
}

interface BatchResultsDisplayProps {
  testResults?: TestResult[];
  batchSummary?: BatchSummary | null;
  completedTests?: number;
  totalTests?: number;
}

export function BatchResultsDisplay({
  testResults = [],
  batchSummary = null,
  completedTests = 0,
  totalTests = 0,
}: BatchResultsDisplayProps) {
  const [selectedTestIndex, setSelectedTestIndex] = useState(0);

  if (testResults.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box
            sx={{
              textAlign: "center",
              py: 6,
              color: "text.secondary",
            }}>
            <AssessmentIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant='h6' sx={{ fontStyle: "italic" }}>
              No completed tests yet...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const selectedTest = testResults[selectedTestIndex] || testResults[0];

  return (
    <Stack spacing={3}>
      {/* Batch Summary */}
      {batchSummary && (
        <Card>
          <CardContent>
            <BatchSummaryCard summary={batchSummary} />
          </CardContent>
        </Card>
      )}

      {/* Test Navigation */}
      <Card>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            Test Results
          </Typography>
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs
              value={selectedTestIndex}
              onChange={(_, newValue) => setSelectedTestIndex(newValue)}
              variant='scrollable'
              scrollButtons='auto'>
              {testResults.map((test, index) => (
                <Tab
                  key={index}
                  label={
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant='body2' sx={{ fontWeight: 600 }}>
                        {test.test_name}
                      </Typography>
                      <Chip
                        size='small'
                        label={`${test.final_metrics?.final_accuracy?.toFixed(
                          1
                        )}%`}
                        color='success'
                        variant='outlined'
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  }
                  icon={<CheckCircleIcon color='success' />}
                />
              ))}

              {/* Placeholder tabs for running tests */}
              {completedTests < totalTests &&
                Array(totalTests - completedTests)
                  .fill(0)
                  .map((_, index) => (
                    <Tab
                      key={`pending-${index}`}
                      disabled
                      label={
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            Test {completedTests + index + 1}
                          </Typography>
                          <Chip
                            size='small'
                            label='Running...'
                            color='primary'
                            variant='outlined'
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      }
                      icon={<PlayArrowIcon color='primary' />}
                    />
                  ))}
            </Tabs>
          </Box>

          {/* Selected Test Details */}
          {selectedTest && (
            <Box>
              {/* Test Header */}
              <Paper
                variant='outlined'
                sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: "grey.50",
                }}>
                <Typography variant='h5' sx={{ mb: 1, fontWeight: 600 }}>
                  {selectedTest.test_name}
                </Typography>
                <Stack direction='row' spacing={1}>
                  <Chip
                    size='small'
                    label={`Iterations: ${selectedTest.test_config?.num_iterations}`}
                    variant='outlined'
                  />
                  <Chip
                    size='small'
                    label={`Seed: ${selectedTest.test_config?.test_params?.seed}`}
                    variant='outlined'
                  />
                </Stack>
              </Paper>

              {/* Individual Test Results */}
              <Box sx={{ mb: 3 }}>
                <ResultsSummary summary={selectedTest.final_metrics} />
              </Box>

              {/* Individual Test Plots */}
              <PlotGrid
                convergenceData={selectedTest.complete_plots?.convergence || []}
                accuracyData={selectedTest.complete_plots?.accuracy || []}
                performanceData={selectedTest.complete_plots?.performance || []}
                errorDistribution={
                  selectedTest.complete_plots?.error_distribution?.data || []
                }
                plotStats={{
                  errorStats:
                    selectedTest.complete_plots?.error_distribution?.stats,
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}

function BatchSummaryCard({ summary }: { summary: BatchSummary }) {
  const metrics = [
    {
      label: "Tests Completed",
      value: summary.total_tests.toString(),
      color: "primary" as const,
      icon: <AssessmentIcon />,
      bgcolor: "primary.50",
    },
    {
      label: "Best Accuracy",
      value: `${summary.best_final_accuracy?.toFixed(2)}%`,
      subtitle: summary.best_performing_test,
      color: "success" as const,
      icon: <TrendingUpIcon />,
      bgcolor: "success.50",
    },
    {
      label: "Avg Throughput",
      value: `${summary.avg_throughput?.toFixed(0)} ops/s`,
      color: "secondary" as const,
      icon: <SpeedIcon />,
      bgcolor: "secondary.50",
    },
    {
      label: "Best Loss",
      value: summary.best_final_loss?.toFixed(4),
      color: "info" as const,
      icon: <TrendingDownIcon />,
      bgcolor: "info.50",
    },
    {
      label: "Worst Accuracy",
      value: `${summary.worst_final_accuracy?.toFixed(2)}%`,
      subtitle: summary.worst_performing_test,
      color: "error" as const,
      icon: <TrendingDownIcon />,
      bgcolor: "error.50",
    },
    {
      label: "Avg Accuracy",
      value: `${summary.avg_final_accuracy?.toFixed(2)}%`,
      color: "warning" as const,
      icon: <TrendingUpIcon />,
      bgcolor: "warning.50",
    },
  ];

  return (
    <Box>
      <Typography variant='h5' sx={{ mb: 3, fontWeight: 600 }}>
        Batch Summary
      </Typography>
      <Grid container spacing={2}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <Paper
              variant='outlined'
              sx={{
                p: 2,
                textAlign: "center",
                bgcolor: metric.bgcolor,
                borderColor: `${metric.color}.200`,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-1px)",
                  boxShadow: 1,
                },
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1,
                  color: `${metric.color}.600`,
                }}>
                {metric.icon}
              </Box>
              <Typography
                variant='caption'
                display='block'
                sx={{
                  color: "text.secondary",
                  mb: 0.5,
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  fontWeight: 500,
                }}>
                {metric.label}
              </Typography>
              <Typography
                variant='h6'
                component='div'
                sx={{
                  fontWeight: 700,
                  color: `${metric.color}.700`,
                  mb: 0.5,
                }}>
                {metric.value}
              </Typography>
              {metric.subtitle && (
                <Typography
                  variant='caption'
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.7rem",
                  }}>
                  {metric.subtitle}
                </Typography>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
