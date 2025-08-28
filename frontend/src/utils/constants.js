// src/utils/constants.js
/**
 * Application constants
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  API_BASE: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// SSE Configuration
export const SSE_CONFIG = {
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  RECONNECT_DELAY: 2000, // 2 seconds
  MAX_RECONNECT_ATTEMPTS: 5,
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  MESSAGE_BUFFER_SIZE: 1000,
};

// Calculation Limits
export const CALCULATION_LIMITS = {
  DEFAULT_ITERATIONS: 5,
  MIN_ITERATIONS: 5,
  MAX_ITERATIONS: 1000,
  MIN_BATCH_TESTS: 1,
  MAX_BATCH_TESTS: 10,
  DEFAULT_SEED: 42,
};

// UI Constants
export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  POLLING_INTERVAL: 2000,
  PROGRESS_UPDATE_THROTTLE: 100,
  MAX_PLOT_POINTS: 1000,
  CHART_COLORS: {
    PRIMARY: "#3B82F6",
    SUCCESS: "#10B981",
    WARNING: "#F59E0B",
    DANGER: "#EF4444",
    PURPLE: "#8B5CF6",
    CYAN: "#06B6D4",
    ORANGE: "#F97316",
  },
};

// Message Types
export const MESSAGE_TYPES = {
  // Single calculation
  PLOT_UPDATE: "plot_update",
  CALCULATION_COMPLETE: "calculation_complete",

  // Batch calculation
  BATCH_STARTED: "batch_started",
  TEST_STARTED: "test_started",
  TEST_ITERATION_UPDATE: "test_iteration_update",
  TEST_COMPLETED: "test_completed",
  BATCH_COMPLETED: "batch_completed",

  // Common
  CURRENT_STATE: "current_state",
  ERROR: "error",
  BATCH_ERROR: "batch_error",
  CONNECTED: "connected",
  TIMEOUT: "timeout",
  CANCELLED: "cancelled",
};

// Status Constants
export const CALCULATION_STATUS = {
  IDLE: "idle",
  STARTING: "starting",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
};

export const CONNECTION_STATUS = {
  CLOSED: "CLOSED",
  CONNECTING: "CONNECTING",
  OPEN: "OPEN",
  ERROR: "ERROR",
};

// File Export
export const EXPORT_FORMATS = {
  JSON: "json",
  CSV: "csv",
  EXCEL: "xlsx",
};

export const EXPORT_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  SUPPORTED_FORMATS: ["json", "csv"],
  DEFAULT_FORMAT: "json",
};

// Validation Rules
export const VALIDATION_RULES = {
  TASK_ID_PATTERN:
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
  TEST_NAME_MAX_LENGTH: 50,
  TEST_NAME_MIN_LENGTH: 1,
  SEED_MIN: 0,
  SEED_MAX: 999999,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR:
    "Network connection failed. Please check your internet connection.",
  SSE_CONNECTION_FAILED:
    "Failed to establish real-time connection. Retrying...",
  CALCULATION_FAILED: "Calculation failed. Please try again.",
  INVALID_PARAMETERS: "Invalid calculation parameters provided.",
  FILE_DOWNLOAD_FAILED: "Failed to download results file.",
  TASK_NOT_FOUND: "Calculation task not found.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  SERVER_ERROR: "Server error occurred. Please try again later.",
  TIMEOUT_ERROR: "Request timed out. Please try again.",
  VALIDATION_ERROR: "Please check your input and try again.",
};

// Success Messages
export const SUCCESS_MESSAGES = {
  CALCULATION_STARTED: "Calculation started successfully",
  BATCH_STARTED: "Batch calculation started successfully",
  CALCULATION_COMPLETED: "Calculation completed successfully",
  BATCH_COMPLETED: "Batch calculation completed successfully",
  CALCULATION_CANCELLED: "Calculation cancelled",
  FILE_DOWNLOADED: "Results file downloaded successfully",
};

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: "calc_user_preferences",
  RECENT_CALCULATIONS: "calc_recent_calculations",
  BATCH_TEMPLATES: "calc_batch_templates",
  UI_STATE: "calc_ui_state",
};

// Plot Configuration
export const PLOT_CONFIG = {
  DEFAULT_BINS: 20,
  MAX_BINS: 50,
  MIN_BINS: 5,
  DECIMATION_THRESHOLD: 1000,
  CHART_HEIGHT: 250,
  CHART_MARGIN: {
    top: 20,
    right: 30,
    bottom: 50,
    left: 40,
  },
  COLORS: {
    LOSS: "#3B82F6",
    VAL_LOSS: "#EF4444",
    ACCURACY: "#10B981",
    PRECISION: "#F59E0B",
    RECALL: "#8B5CF6",
    THROUGHPUT: "#06B6D4",
    MEMORY: "#EC4899",
    CPU: "#F97316",
  },
};

// Development flags
export const DEV_CONFIG = {
  DEBUG_SSE: process.env.NODE_ENV === "development",
  SHOW_DEBUG_INFO: process.env.NODE_ENV === "development",
  ENABLE_ACKNOWLEDGMENTS: process.env.NODE_ENV === "development",
  LOG_API_CALLS: process.env.NODE_ENV === "development",
};
