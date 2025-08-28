// src/utils/formatters.js
/**
 * Formatting utility functions
 */

/**
 * Format bytes to human readable string
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted string
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Format time duration to readable string
 * @param {number} seconds - Duration in seconds
 * @param {boolean} showSeconds - Whether to show seconds
 * @returns {string} Formatted duration
 */
export function formatDuration(seconds, showSeconds = true) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return showSeconds
      ? `${hours}:${minutes.toString().padStart(2, "0")}:${secs
          .toString()
          .padStart(2, "0")}`
      : `${hours}:${minutes.toString().padStart(2, "0")}`;
  }

  return showSeconds
    ? `${minutes}:${secs.toString().padStart(2, "0")}`
    : `${minutes}m`;
}

/**
 * Format elapsed time from timestamp
 * @param {number} startTime - Start timestamp in milliseconds
 * @param {number} endTime - End timestamp (optional, defaults to now)
 * @returns {string} Formatted elapsed time
 */
export function formatElapsedTime(startTime, endTime = Date.now()) {
  const elapsedSeconds = Math.floor((endTime - startTime) / 1000);
  return formatDuration(elapsedSeconds);
}

/**
 * Format number with appropriate precision
 * @param {number} value - Number to format
 * @param {number} precision - Number of decimal places
 * @param {boolean} useScientific - Use scientific notation for very small/large numbers
 * @returns {string} Formatted number
 */
export function formatNumber(value, precision = 2, useScientific = false) {
  if (value === null || value === undefined || isNaN(value)) {
    return "N/A";
  }

  if (useScientific && (Math.abs(value) < 0.001 || Math.abs(value) > 1000000)) {
    return value.toExponential(precision);
  }

  return value.toFixed(precision);
}

/**
 * Format percentage
 * @param {number} value - Value between 0 and 1 or 0 and 100
 * @param {number} precision - Number of decimal places
 * @param {boolean} isDecimal - Whether input is decimal (0-1) or percentage (0-100)
 * @returns {string} Formatted percentage
 */
export function formatPercentage(value, precision = 1, isDecimal = false) {
  if (value === null || value === undefined || isNaN(value)) {
    return "N/A";
  }

  const percentage = isDecimal ? value * 100 : value;
  return `${percentage.toFixed(precision)}%`;
}

/**
 * Format large numbers with thousand separators
 * @param {number} value - Number to format
 * @param {string} locale - Locale for formatting
 * @returns {string} Formatted number with separators
 */
export function formatLargeNumber(value, locale = "en-US") {
  if (value === null || value === undefined || isNaN(value)) {
    return "N/A";
  }

  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format metric values with appropriate units
 * @param {number} value - Metric value
 * @param {string} unit - Base unit (e.g., 'ops/s', 'MB', 'ms')
 * @param {number} precision - Decimal precision
 * @returns {string} Formatted metric
 */
export function formatMetric(value, unit = "", precision = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return `N/A ${unit}`;
  }

  // Handle different unit types
  if (unit === "bytes" || unit === "B") {
    return formatBytes(value, precision);
  }

  if (unit === "ms") {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(precision)} s`;
    }
    return `${value.toFixed(precision)} ms`;
  }

  if (unit === "ops/s") {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(precision)} Mops/s`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(precision)} Kops/s`;
    }
    return `${value.toFixed(precision)} ops/s`;
  }

  return `${formatNumber(value, precision)} ${unit}`;
}

/**
 * Format timestamp to readable date/time
 * @param {number|Date} timestamp - Timestamp or Date object
 * @param {boolean} includeTime - Whether to include time
 * @param {string} locale - Locale for formatting
 * @returns {string} Formatted date/time
 */
export function formatTimestamp(
  timestamp,
  includeTime = true,
  locale = "en-US"
) {
  if (!timestamp) return "N/A";

  const date = new Date(timestamp);

  if (includeTime) {
    return date.toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format relative time (e.g., "2 minutes ago")
 * @param {number|Date} timestamp - Timestamp or Date object
 * @param {string} locale - Locale for formatting
 * @returns {string} Relative time string
 */
export function formatRelativeTime(timestamp, locale = "en-US") {
  if (!timestamp) return "N/A";

  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;

  return formatTimestamp(timestamp, false, locale);
}

/**
 * Format task ID for display (show first 8 characters)
 * @param {string} taskId - Full task ID
 * @returns {string} Shortened task ID
 */
export function formatTaskId(taskId) {
  if (!taskId) return "N/A";
  return taskId.slice(0, 8);
}

/**
 * Format progress as a descriptive string
 * @param {number} current - Current progress
 * @param {number} total - Total items
 * @param {string} unit - Unit name (e.g., 'test', 'iteration')
 * @returns {string} Progress description
 */
export function formatProgress(current, total, unit = "item") {
  if (total === 0) return `0 ${unit}s`;

  const percentage = Math.round((current / total) * 100);
  const pluralUnit = unit + (total === 1 ? "" : "s");

  return `${current}/${total} ${pluralUnit} (${percentage}%)`;
}

/**
 * Format error messages for display
 * @param {Error|string} error - Error object or message
 * @returns {string} User-friendly error message
 */
export function formatError(error) {
  if (!error) return "Unknown error occurred";

  if (typeof error === "string") return error;

  if (error.message) {
    // Clean up common error message patterns
    let message = error.message;

    // Remove technical stack traces
    message = message.split("\n")[0];

    // Remove "Error:" prefix if present
    message = message.replace(/^Error:\s*/, "");

    // Capitalize first letter
    message = message.charAt(0).toUpperCase() + message.slice(1);

    return message;
  }

  return "An error occurred";
}

/**
 * Format file size limit for display
 * @param {number} bytes - Size limit in bytes
 * @returns {string} Formatted size limit
 */
export function formatSizeLimit(bytes) {
  return `Maximum file size: ${formatBytes(bytes)}`;
}

/**
 * Format calculation statistics
 * @param {Object} stats - Statistics object
 * @returns {Object} Formatted statistics
 */
export function formatStats(stats) {
  if (!stats) return {};

  const formatted = {};

  Object.entries(stats).forEach(([key, value]) => {
    if (typeof value === "number") {
      if (key.includes("time") || key.includes("duration")) {
        formatted[key] = formatDuration(value);
      } else if (key.includes("percentage") || key.includes("accuracy")) {
        formatted[key] = formatPercentage(value, 2, false);
      } else if (key.includes("size") || key.includes("bytes")) {
        formatted[key] = formatBytes(value);
      } else {
        formatted[key] = formatNumber(value);
      }
    } else {
      formatted[key] = value;
    }
  });

  return formatted;
}
