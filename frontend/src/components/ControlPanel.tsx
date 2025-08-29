// src/components/ControlPanel/ControlPanel.tsx
import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Box,
  Stack,
  Divider,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Download as DownloadIcon,
  HealthAndSafety as HealthIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";
import { CALCULATION_LIMITS } from "@/src/utils/constants";

interface ControlPanelProps {
  onStartSingle: (numIterations: number, testParams: any) => void;
  onStartBatch: (batchConfig: any) => void;
  onCancel: () => void;
  onDownload: (format: string) => void;
  isRunning: boolean;
  taskId: string | null;
  isBatchMode?: boolean;
}

export function ControlPanel({
  onStartSingle,
  onStartBatch,
  onCancel,
  onDownload,
  isRunning,
  taskId,
  isBatchMode = false,
}: ControlPanelProps) {
  const customConfig = {
    dictionaries: [adjectives, colors, animals],
    separator: " ",
    length: 3,
    style: "capital" as const,
  };

  const generateUniqueName = () => {
    return uniqueNamesGenerator(customConfig);
  };

  const [numIterations, setNumIterations] = useState(
    CALCULATION_LIMITS.DEFAULT_ITERATIONS
  );
  const [mode, setMode] = useState("single");
  const [batchTests, setBatchTests] = useState(
    Array.from({ length: CALCULATION_LIMITS.MIN_BATCH_TESTS }, () => ({
      name: generateUniqueName(),
      num_iterations: CALCULATION_LIMITS.DEFAULT_ITERATIONS,
      test_params: { seed: CALCULATION_LIMITS.DEFAULT_SEED },
    }))
  );

  const handleStartSingle = () => {
    onStartSingle(numIterations, { seed: CALCULATION_LIMITS.DEFAULT_SEED });
  };

  const handleStartBatch = () => {
    const batchConfig = {
      tests: batchTests.map((test, index) => ({
        ...test,
        name: test.name || `Test ${index + 1}`,
      })),
    };
    onStartBatch(batchConfig);
  };

  const addTest = () => {
    if (batchTests.length >= CALCULATION_LIMITS.MAX_BATCH_TESTS) return;
    setBatchTests([
      ...batchTests,
      {
        name: generateUniqueName(),
        num_iterations: CALCULATION_LIMITS.DEFAULT_ITERATIONS,
        test_params: { seed: Math.floor(Math.random() * 1000) },
      },
    ]);
  };

  const removeTest = (index: number) => {
    if (batchTests.length <= CALCULATION_LIMITS.MIN_BATCH_TESTS) return;
    setBatchTests(batchTests.filter((_, i) => i !== index));
  };

  const updateTest = (index: number, field: string, value: any) => {
    const updated = [...batchTests];
    if (field === "num_iterations") {
      updated[index][field] = parseInt(value) || 0;
    } else if (field === "seed") {
      updated[index].test_params = {
        ...updated[index].test_params,
        seed: parseInt(value) || 0,
      };
    } else {
      updated[index][field] = value;
    }
    setBatchTests(updated);
  };

  const handleHealthCheck = async () => {
    try {
      const res = await fetch(`http://localhost:5000/health`);
      const data = await res.json();
      console.log("Health Check:", data);
    } catch (error) {
      console.error("Health Check Failed:", error);
    }
  };

  return (
    <Card>
      <CardContent>
        {/* Mode Selection */}
        <FormControl component='fieldset' sx={{ mb: 3 }}>
          <FormLabel component='legend'>
            <Typography variant='h6'>Calculation Mode</Typography>
          </FormLabel>
          <RadioGroup
            row
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            sx={{ mt: 1 }}>
            <FormControlLabel
              value='single'
              control={<Radio disabled={isRunning} />}
              label='Single Calculation'
            />
            <FormControlLabel
              value='batch'
              control={<Radio disabled={isRunning} />}
              label='Batch Calculations'
            />
          </RadioGroup>
        </FormControl>

        <Divider sx={{ mb: 3 }} />

        {/* Single Mode Controls */}
        {mode === "single" && (
          <Box sx={{ mb: 3 }}>
            <TextField
              label='Number of Iterations'
              type='number'
              value={numIterations}
              onChange={(e) => setNumIterations(Number(e.target.value))}
              inputProps={{
                min: CALCULATION_LIMITS.MIN_ITERATIONS,
                max: CALCULATION_LIMITS.MAX_ITERATIONS,
              }}
              disabled={isRunning}
              size='medium'
              sx={{ minWidth: 200 }}
            />
          </Box>
        )}

        {/* Batch Mode Controls */}
        {mode === "batch" && (
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}>
              <Typography variant='h6'>Test Configurations</Typography>
              <Button
                variant='outlined'
                size='small'
                startIcon={<AddIcon />}
                onClick={addTest}
                disabled={
                  isRunning ||
                  batchTests.length >= CALCULATION_LIMITS.MAX_BATCH_TESTS
                }>
                Add Test
              </Button>
            </Box>

            <Stack spacing={2}>
              {batchTests.map((test, index) => (
                <Accordion key={index} defaultExpanded>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      bgcolor: "grey.50",
                      "&:hover": { bgcolor: "grey.100" },
                    }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        mr: 1,
                      }}>
                      <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                        {test.name}
                      </Typography>
                      {batchTests.length >
                        CALCULATION_LIMITS.MIN_BATCH_TESTS && (
                        <IconButton
                          size='small'
                          color='error'
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTest(index);
                          }}
                          disabled={isRunning}>
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      <TextField
                        label='Test Name'
                        value={test.name}
                        onChange={(e) =>
                          updateTest(index, "name", e.target.value)
                        }
                        disabled={isRunning}
                        fullWidth
                        variant='outlined'
                      />
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <TextField
                          label='Iterations'
                          type='number'
                          value={test.num_iterations}
                          onChange={(e) =>
                            updateTest(index, "num_iterations", e.target.value)
                          }
                          inputProps={{ min: 10, max: 100 }}
                          disabled={isRunning}
                          sx={{ minWidth: 120 }}
                        />
                        <TextField
                          label='Seed'
                          type='number'
                          value={test.test_params?.seed || 0}
                          onChange={(e) =>
                            updateTest(index, "seed", e.target.value)
                          }
                          disabled={isRunning}
                          sx={{ minWidth: 120 }}
                        />
                      </Box>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {mode === "single" && (
            <Button
              variant='contained'
              size='large'
              startIcon={<PlayArrowIcon />}
              onClick={handleStartSingle}
              disabled={isRunning}
              color='primary'>
              Start Single Calculation
            </Button>
          )}

          {mode === "batch" && (
            <Button
              variant='contained'
              size='large'
              startIcon={<PlayArrowIcon />}
              onClick={handleStartBatch}
              disabled={isRunning || batchTests.length === 0}
              color='primary'>
              Start Batch ({batchTests.length} tests)
            </Button>
          )}

          <Button
            variant='outlined'
            size='large'
            startIcon={<HealthIcon />}
            onClick={handleHealthCheck}
            disabled={isRunning}
            color='secondary'>
            Health Check
          </Button>

          {isRunning && (
            <Button
              variant='contained'
              size='large'
              startIcon={<StopIcon />}
              onClick={onCancel}
              color='error'>
              Cancel {isBatchMode ? "Batch" : "Calculation"}
            </Button>
          )}

          {taskId && !isRunning && (
            <>
              <Button
                variant='contained'
                size='large'
                startIcon={<DownloadIcon />}
                onClick={() => onDownload("json")}
                color='success'>
                Download JSON
              </Button>
              <Button
                variant='outlined'
                size='large'
                startIcon={<DownloadIcon />}
                onClick={() => onDownload("csv")}
                color='secondary'>
                Download CSV
              </Button>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
