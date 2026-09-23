/**
 * PURPOSE: The one number the churn view's definition depends on — how many work items must have
 * marked a unit before that unit counts as "churn" rather than an ordinary single mark.
 *
 * USAGE:
 * unitChurnStatics.limits.minMarksForChurn;
 * // Returns 2 — the fewest marks unitChurnContract accepts
 */

export const unitChurnStatics = {
  limits: {
    minMarksForChurn: 2,
  },
} as const;
