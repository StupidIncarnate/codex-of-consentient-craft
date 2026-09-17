/**
 * PURPOSE: The shape a `{step.row.field}` reference must have, and the segment count of its most
 * common malformed cousin — `{step.field}`, the mistake of treating `as:` as if it named a ROW
 * rather than a STEP. Reach for this over inlining either number so the parse checks and their own
 * refusal messages read the same numbers.
 *
 * USAGE:
 * stepRefStatics.grammar.segmentCount;
 * // Returns 3
 */

export const stepRefStatics = {
  grammar: {
    segmentCount: 3,
  },
  mistakes: {
    stepFieldSegmentCount: 2,
  },
} as const;
