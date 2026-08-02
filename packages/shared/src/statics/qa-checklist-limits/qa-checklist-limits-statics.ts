/**
 * PURPOSE: Bounds on QA checklist enumeration, so a pathological flow graph cannot produce an
 * unbounded path list
 *
 * USAGE:
 * qaChecklistLimitsStatics.maxPaths;
 * // Returns the cap on enumerated simple paths per flow
 *
 * Simple-path enumeration is worst-case exponential in the number of branching nodes. Real quest
 * flows sit far below this cap (the largest observed is seven), so it is a backstop rather than a
 * working constraint — and when it does bite, `QaChecklist.pathsTruncated` says so out loud.
 * Truncating silently would let a partial itinerary read as a complete one, which is the exact
 * class of quiet under-coverage this whole surface exists to remove.
 */

export const qaChecklistLimitsStatics = {
  maxPaths: 200,
} as const;
