/**
 * PURPOSE: Defines Claude Code hook process-exit codes by semantic name. Claude Code interprets exit codes from hook subprocesses to decide what to do: 0 is silent success, 2 is a blocking failure that surfaces stderr back to Claude for it to react, and any other non-zero is non-blocking failure shown to the user only.
 *
 * USAGE:
 * process.exit(hookExitCodeStatics.blockingFailure);
 * // Tells Claude Code to feed the hook's stderr back to Claude as a blocking error.
 */
export const hookExitCodeStatics = {
  success: 0,
  blockingFailure: 2,
} as const;
