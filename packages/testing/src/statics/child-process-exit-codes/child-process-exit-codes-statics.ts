/**
 * PURPOSE: Defines standard exit codes for child process testing
 *
 * USAGE:
 * const code = childProcessExitCodesStatics.SUCCESS;
 * // Returns 0
 */

export const childProcessExitCodesStatics = {
  SUCCESS: 0,
  ERROR: 1,
  ESLINT_CRASH: 2,
} as const;
