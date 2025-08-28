// src/contexts/CalculationContext.jsx
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";

// Action types
const CALCULATION_ACTIONS = {
  START_SINGLE: "START_SINGLE",
  START_BATCH: "START_BATCH",
  UPDATE_PROGRESS: "UPDATE_PROGRESS",
  UPDATE_BATCH_PROGRESS: "UPDATE_BATCH_PROGRESS",
  ADD_TEST_RESULT: "ADD_TEST_RESULT",
  COMPLETE_CALCULATION: "COMPLETE_CALCULATION",
  SET_ERROR: "SET_ERROR",
  CANCEL_CALCULATION: "CANCEL_CALCULATION",
  RESET: "RESET",
};

// Initial state
const initialState = {
  // Common state
  taskId: null,
  isRunning: false,
  error: null,
  startTime: null,
  endTime: null,

  // Single calculation state
  progress: 0,
  currentIteration: 0,
  totalIterations: 0,

  // Batch state
  isBatchMode: false,
  batchProgress: 0,
  totalTests: 0,
  completedTests: 0,
  currentTestIndex: 0,
  currentTestProgress: 0,
  testResults: [],
  batchSummary: null,

  // Results
  finalResults: null,
  plotData: {
    convergence: [],
    accuracy: [],
    performance: [],
    errorDistribution: [],
  },
};

// Reducer
function calculationReducer(state, action) {
  switch (action.type) {
    case CALCULATION_ACTIONS.START_SINGLE:
      return {
        ...initialState,
        taskId: action.payload.taskId,
        isRunning: true,
        isBatchMode: false,
        totalIterations: action.payload.numIterations,
        startTime: Date.now(),
      };

    case CALCULATION_ACTIONS.START_BATCH:
      return {
        ...initialState,
        taskId: action.payload.taskId,
        isRunning: true,
        isBatchMode: true,
        totalTests: action.payload.totalTests,
        startTime: Date.now(),
      };

    case CALCULATION_ACTIONS.UPDATE_PROGRESS:
      return {
        ...state,
        progress: action.payload.progress,
        currentIteration:
          action.payload.currentIteration || state.currentIteration,
      };

    case CALCULATION_ACTIONS.UPDATE_BATCH_PROGRESS:
      return {
        ...state,
        batchProgress: action.payload.batchProgress || state.batchProgress,
        completedTests: action.payload.completedTests || state.completedTests,
        currentTestIndex:
          action.payload.currentTestIndex || state.currentTestIndex,
        currentTestProgress:
          action.payload.currentTestProgress || state.currentTestProgress,
      };

    case CALCULATION_ACTIONS.ADD_TEST_RESULT:
      return {
        ...state,
        testResults: [...state.testResults, action.payload],
      };

    case CALCULATION_ACTIONS.COMPLETE_CALCULATION:
      return {
        ...state,
        isRunning: false,
        endTime: Date.now(),
        progress: 100,
        batchProgress: 100,
        finalResults: action.payload.results,
        batchSummary: action.payload.batchSummary || state.batchSummary,
        plotData: action.payload.plotData || state.plotData,
      };

    case CALCULATION_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isRunning: false,
      };

    case CALCULATION_ACTIONS.CANCEL_CALCULATION:
      return {
        ...state,
        isRunning: false,
        progress: 0,
        batchProgress: 0,
        error: "Calculation cancelled",
      };

    case CALCULATION_ACTIONS.RESET:
      return initialState;

    default:
      return state;
  }
}

// Context
const CalculationContext = createContext();

// Provider component
export function CalculationProvider({ children }) {
  const [state, dispatch] = useReducer(calculationReducer, initialState);

  // Action creators
  const actions = {
    startSingle: useCallback((taskId, numIterations) => {
      dispatch({
        type: CALCULATION_ACTIONS.START_SINGLE,
        payload: { taskId, numIterations },
      });
    }, []),

    startBatch: useCallback((taskId, totalTests) => {
      dispatch({
        type: CALCULATION_ACTIONS.START_BATCH,
        payload: { taskId, totalTests },
      });
    }, []),

    updateProgress: useCallback((progress, currentIteration) => {
      dispatch({
        type: CALCULATION_ACTIONS.UPDATE_PROGRESS,
        payload: { progress, currentIteration },
      });
    }, []),

    updateBatchProgress: useCallback(
      (
        batchProgress,
        completedTests,
        currentTestIndex,
        currentTestProgress
      ) => {
        dispatch({
          type: CALCULATION_ACTIONS.UPDATE_BATCH_PROGRESS,
          payload: {
            batchProgress,
            completedTests,
            currentTestIndex,
            currentTestProgress,
          },
        });
      },
      []
    ),

    addTestResult: useCallback((testResult) => {
      dispatch({
        type: CALCULATION_ACTIONS.ADD_TEST_RESULT,
        payload: testResult,
      });
    }, []),

    completeCalculation: useCallback((results, batchSummary, plotData) => {
      dispatch({
        type: CALCULATION_ACTIONS.COMPLETE_CALCULATION,
        payload: { results, batchSummary, plotData },
      });
    }, []),

    setError: useCallback((error) => {
      dispatch({
        type: CALCULATION_ACTIONS.SET_ERROR,
        payload: error,
      });
    }, []),

    cancelCalculation: useCallback(() => {
      dispatch({ type: CALCULATION_ACTIONS.CANCEL_CALCULATION });
    }, []),

    reset: useCallback(() => {
      dispatch({ type: CALCULATION_ACTIONS.RESET });
    }, []),
  };

  // Computed values
  const computedValues = {
    elapsedTime:
      state.startTime && state.isRunning
        ? Math.floor((Date.now() - state.startTime) / 1000)
        : state.startTime && state.endTime
        ? Math.floor((state.endTime - state.startTime) / 1000)
        : 0,

    isCompleted:
      !state.isRunning &&
      (state.progress === 100 || state.batchProgress === 100),

    hasResults: Boolean(state.finalResults || state.testResults.length > 0),

    currentTestName:
      state.testResults[state.currentTestIndex]?.test_name ||
      `Test ${state.currentTestIndex + 1}`,
  };

  const value = {
    ...state,
    ...computedValues,
    actions,
  };

  return (
    <CalculationContext.Provider value={value}>
      {children}
    </CalculationContext.Provider>
  );
}

// Custom hook
export function useCalculationContext() {
  const context = useContext(CalculationContext);
  if (!context) {
    throw new Error(
      "useCalculationContext must be used within a CalculationProvider"
    );
  }
  return context;
}

// Export action types for external use
export { CALCULATION_ACTIONS };
