/**
 * PURPOSE: The nesting depth the `session-with-nested-chain` recipe seeds — two levels, so the
 * chain's own test can tell "the first agent" and "the agent nested under it" apart.
 *
 * USAGE:
 * sessionWithNestedChainStatics.counts.depth;
 * // Returns 2
 */
export const sessionWithNestedChainStatics = {
  counts: {
    depth: 2,
  },
} as const;
