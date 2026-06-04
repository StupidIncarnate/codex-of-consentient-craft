/**
 * PURPOSE: Caps how many trailing characters of a crash project's rawOutput are embedded in
 * the ward detail JSON. Crash output (a suite that failed to run, with no structured errors)
 * is the only place rawOutput rides along in the detail blob, so it is tail-capped to keep the
 * blob bounded while preserving the error tail.
 *
 * USAGE:
 * rawOutputCapStatics.cap.maxChars;
 * // Returns: 8000
 */
export const rawOutputCapStatics = {
  cap: {
    maxChars: 8000,
  },
} as const;
