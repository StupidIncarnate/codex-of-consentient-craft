/**
 * PURPOSE: Defines ESLint severity level constants for error and warning categorization
 *
 * USAGE:
 * const errorMessages = messages.filter(msg => msg.severity === lintSeverityStatics.error);
 * // Filters lint messages to only error-level violations
 */
export const lintSeverityStatics = {
  warning: 1,
  error: 2,
} as const;
