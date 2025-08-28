// src/utils/validators.js
/**
 * Client-side validation utilities
 */

import { VALIDATION_RULES, CALCULATION_LIMITS } from "./constants";
import { formatBytes } from "./formatters";

/**
 * Validate task ID format
 * @param {string} taskId - Task ID to validate
 * @returns {boolean} Whether the task ID is valid
 */
export function isValidTaskId(taskId) {
  if (!taskId || typeof taskId !== "string") {
    return false;
  }
  return VALIDATION_RULES.TASK_ID_PATTERN.test(taskId);
}

/**
 * Validate number of iterations
 * @param {number} iterations - Number of iterations
 * @returns {Object} Validation result with isValid and error message
 */
export function validateIterations(iterations) {
  if (iterations === null || iterations === undefined) {
    return { isValid: false, error: "Number of iterations is required" };
  }

  if (!Number.isInteger(iterations)) {
    return {
      isValid: false,
      error: "Number of iterations must be a whole number",
    };
  }

  if (iterations < CALCULATION_LIMITS.MIN_ITERATIONS) {
    return {
      isValid: false,
      error: `Number of iterations must be at least ${CALCULATION_LIMITS.MIN_ITERATIONS}`,
    };
  }

  if (iterations > CALCULATION_LIMITS.MAX_ITERATIONS) {
    return {
      isValid: false,
      error: `Number of iterations cannot exceed ${CALCULATION_LIMITS.MAX_ITERATIONS}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate seed value
 * @param {number} seed - Seed value
 * @returns {Object} Validation result
 */
export function validateSeed(seed) {
  if (seed === null || seed === undefined) {
    return { isValid: true }; // Seed is optional
  }

  if (!Number.isInteger(seed)) {
    return { isValid: false, error: "Seed must be a whole number" };
  }

  if (seed < VALIDATION_RULES.SEED_MIN || seed > VALIDATION_RULES.SEED_MAX) {
    return {
      isValid: false,
      error: `Seed must be between ${VALIDATION_RULES.SEED_MIN} and ${VALIDATION_RULES.SEED_MAX}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate test name
 * @param {string} name - Test name to validate
 * @returns {Object} Validation result
 */
export function validateTestName(name) {
  if (!name || typeof name !== "string") {
    return { isValid: false, error: "Test name is required" };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < VALIDATION_RULES.TEST_NAME_MIN_LENGTH) {
    return {
      isValid: false,
      error: `Test name must be at least ${VALIDATION_RULES.TEST_NAME_MIN_LENGTH} character long`,
    };
  }

  if (trimmedName.length > VALIDATION_RULES.TEST_NAME_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Test name cannot exceed ${VALIDATION_RULES.TEST_NAME_MAX_LENGTH} characters`,
    };
  }

  // Check for invalid characters
  if (/[<>:"/\\|?*]/.test(trimmedName)) {
    return {
      isValid: false,
      error: "Test name contains invalid characters",
    };
  }

  return { isValid: true };
}

/**
 * Validate single calculation parameters
 * @param {Object} params - Calculation parameters
 * @returns {Object} Validation result with errors array
 */
export function validateCalculationParams(params) {
  const errors = [];

  if (!params || typeof params !== "object") {
    return { isValid: false, errors: ["Invalid parameters provided"] };
  }

  // Validate iterations
  const iterationsResult = validateIterations(params.num_iterations);
  if (!iterationsResult.isValid) {
    errors.push(iterationsResult.error);
  }

  // Validate test parameters if provided
  if (params.test_params) {
    const { test_params } = params;

    if (typeof test_params !== "object") {
      errors.push("Test parameters must be an object");
    } else {
      // Validate seed if provided
      if (test_params.seed !== undefined) {
        const seedResult = validateSeed(test_params.seed);
        if (!seedResult.isValid) {
          errors.push(seedResult.error);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate batch configuration
 * @param {Object} batchConfig - Batch configuration
 * @returns {Object} Validation result with errors array
 */
export function validateBatchConfig(batchConfig) {
  const errors = [];

  if (!batchConfig || typeof batchConfig !== "object") {
    return { isValid: false, errors: ["Invalid batch configuration provided"] };
  }

  const { tests } = batchConfig;

  if (!Array.isArray(tests)) {
    return { isValid: false, errors: ["Tests must be an array"] };
  }

  if (tests.length < CALCULATION_LIMITS.MIN_BATCH_TESTS) {
    errors.push(
      `At least ${CALCULATION_LIMITS.MIN_BATCH_TESTS} test is required`
    );
  }

  if (tests.length > CALCULATION_LIMITS.MAX_BATCH_TESTS) {
    errors.push(`Maximum ${CALCULATION_LIMITS.MAX_BATCH_TESTS} tests allowed`);
  }

  // Validate each test configuration
  tests.forEach((test, index) => {
    if (!test || typeof test !== "object") {
      errors.push(`Test ${index + 1}: Invalid test configuration`);
      return;
    }

    // Validate test name
    const nameResult = validateTestName(test.name);
    if (!nameResult.isValid) {
      errors.push(`Test ${index + 1}: ${nameResult.error}`);
    }

    // Validate iterations
    const iterationsResult = validateIterations(test.num_iterations);
    if (!iterationsResult.isValid) {
      errors.push(`Test ${index + 1}: ${iterationsResult.error}`);
    }

    // Validate test parameters
    if (test.test_params) {
      if (typeof test.test_params !== "object") {
        errors.push(`Test ${index + 1}: Test parameters must be an object`);
      } else if (test.test_params.seed !== undefined) {
        const seedResult = validateSeed(test.test_params.seed);
        if (!seedResult.isValid) {
          errors.push(`Test ${index + 1}: ${seedResult.error}`);
        }
      }
    }
  });

  // Check for duplicate test names
  const testNames = tests
    .map((test) => test.name?.trim().toLowerCase())
    .filter(Boolean);
  const duplicateNames = testNames.filter(
    (name, index) => testNames.indexOf(name) !== index
  );

  if (duplicateNames.length > 0) {
    errors.push("Test names must be unique");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email address
 * @param {string} email - Email address to validate
 * @returns {Object} Validation result
 */
export function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return { isValid: false, error: "Email is required" };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  return { isValid: true };
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {Object} Validation result
 */
export function validateUrl(url) {
  if (!url || typeof url !== "string") {
    return { isValid: false, error: "URL is required" };
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: "Please enter a valid URL" };
  }
}

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {number} maxSize - Maximum size in bytes
 * @returns {Object} Validation result
 */
export function validateFileSize(file, maxSize) {
  if (!file || !file.size) {
    return { isValid: false, error: "Invalid file" };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds ${formatBytes(maxSize)} limit`,
    };
  }

  return { isValid: true };
}

/**
 * Validate file type
 * @param {File} file - File to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {Object} Validation result
 */
export function validateFileType(file, allowedTypes) {
  if (!file || !file.type) {
    return { isValid: false, error: "Invalid file" };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not supported`,
    };
  }

  return { isValid: true };
}

/**
 * Validate form data and return consolidated results
 * @param {Object} data - Form data to validate
 * @param {Object} rules - Validation rules for each field
 * @returns {Object} Validation results with field-level errors
 */
export function validateForm(data, rules) {
  const errors = {};
  let isValid = true;

  Object.entries(rules).forEach(([field, validators]) => {
    const value = data[field];
    const fieldErrors = [];

    validators.forEach((validator) => {
      const result = validator(value);
      if (!result.isValid) {
        fieldErrors.push(result.error);
        isValid = false;
      }
    });

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  });

  return {
    isValid,
    errors,
    hasErrors: Object.keys(errors).length > 0,
  };
}

/**
 * Sanitize string input
 * @param {string} input - String to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized string
 */
export function sanitizeString(input, options = {}) {
  if (!input || typeof input !== "string") {
    return "";
  }

  let sanitized = input.trim();

  // Remove or escape HTML tags if specified
  if (options.stripHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, "");
  }

  // Limit length if specified
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  // Remove special characters if specified
  if (options.alphanumericOnly) {
    sanitized = sanitized.replace(/[^a-zA-Z0-9\s]/g, "");
  }

  return sanitized;
}
