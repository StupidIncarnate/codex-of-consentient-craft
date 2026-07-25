/**
 * PURPOSE: Defines the process exit codes ward reports, separating "your code is red" from
 * "ward itself could not run". Consumers that dispatch ward (the orchestrator's ward work item)
 * route on this: a `failing` run gets a fix-and-retry loop, a `crash` run has nothing to fix.
 *
 * USAGE:
 * wardExitCodeStatics.exitCodes.crash;
 * // Returns: 2
 */
export const wardExitCodeStatics = {
  exitCodes: {
    pass: 0,
    failing: 1,
    crash: 2,
  },
} as const;
