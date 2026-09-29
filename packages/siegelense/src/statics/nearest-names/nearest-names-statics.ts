/**
 * PURPOSE: How many ranked near-miss testIds a NO MATCH answer names before it switches to a count
 * of the rest. A missed name is almost always one of the closest few, and every name past that is
 * noise on a dense page, so the answer shows the top few and says how many more exist.
 *
 * USAGE:
 * nearestNamesStatics.limits.shown;
 * // Returns 5
 */
export const nearestNamesStatics = {
  limits: {
    shown: 5,
  },
} as const;
