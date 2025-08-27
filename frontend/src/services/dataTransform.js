// src/services/dataTransform.js
/**
 * Data transformation utilities
 */
export class DataTransformService {
  /**
   * Create histogram bins from raw data
   */
  static createHistogram(data, numBins = 20) {
    if (!data || data.length === 0) return [];

    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / numBins;

    const bins = Array(numBins)
      .fill(0)
      .map((_, i) => ({
        range: `${(min + i * binWidth).toFixed(2)}`,
        count: 0,
      }));

    data.forEach((value) => {
      const binIndex = Math.min(
        Math.floor((value - min) / binWidth),
        numBins - 1
      );
      bins[binIndex].count++;
    });

    return bins;
  }

  /**
   * Decimate data for performance
   */
  static decimateData(data, maxPoints = 1000) {
    if (data.length <= maxPoints) return data;

    const step = Math.floor(data.length / maxPoints);
    return data.filter((_, index) => index % step === 0);
  }

  /**
   * Format bytes to human readable
   */
  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  /**
   * Calculate statistics
   */
  static calculateStats(data) {
    if (!data || data.length === 0) return null;

    const sorted = [...data].sort((a, b) => a - b);
    const sum = data.reduce((a, b) => a + b, 0);
    const mean = sum / data.length;

    const squareDiffs = data.map((value) => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / data.length;
    const std = Math.sqrt(avgSquareDiff);

    return {
      mean,
      std,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      q1: sorted[Math.floor(sorted.length * 0.25)],
      q3: sorted[Math.floor(sorted.length * 0.75)],
    };
  }
}
