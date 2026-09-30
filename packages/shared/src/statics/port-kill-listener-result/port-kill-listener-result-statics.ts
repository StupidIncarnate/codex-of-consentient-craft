/**
 * PURPOSE: Defines the bounds of the exit code a process reports to its parent, the ceiling a
 * port-kill result's exitCode is validated against.
 *
 * USAGE:
 * portKillListenerResultStatics.exitCode.max;
 * // Returns: 255
 */
export const portKillListenerResultStatics = {
  exitCode: {
    min: 0,
    max: 255,
  },
} as const;
