/**
 * PURPOSE: Quest statuses that should automatically trigger the orchestration loop after a modify
 *
 * USAGE:
 * autoResumableQuestStatusesStatics.some((s) => s === nextStatus);
 * // Returns true if the status transition should auto-resume the orchestration loop
 */

export const autoResumableQuestStatusesStatics = [
  'flows_approved',
  'explore_observables',
  'in_progress',
] as const;
