/**
 * PURPOSE: Configuration limits and defaults for machine resource consumption (memory and disk).
 *
 * USAGE:
 * machineResourcesStatics.maxMemoryPercent.default;
 * // Returns: 80
 */
export const machineResourcesStatics = {
  maxMemoryPercent: { min: 10, max: 100, default: 80 },
  maxCpuPercent: { min: 10, max: 95, default: 75 },
  maxDiskMB: { min: 1024, default: 16384 },
} as const;
