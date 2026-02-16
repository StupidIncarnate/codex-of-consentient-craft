/**
 * PURPOSE: Maps ESLint numeric severity codes to ErrorEntry severity strings
 *
 * USAGE:
 * eslintSeverityStatics[2];
 * // Returns 'error'
 */

export const eslintSeverityStatics = {
  1: 'warning',
  2: 'error',
} as const;
