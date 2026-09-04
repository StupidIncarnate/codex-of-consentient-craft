/**
 * PURPOSE: The numbers a digest falls back to when a caller names none. Each was picked against real
 * transcripts rather than chosen round: `gapFloorSeconds` is the point below which a pause is a model
 * thinking rather than a session waiting, and `resultFloorBytes` is where a tool result stops being
 * incidental and starts driving the context cost the digest exists to explain.
 *
 * USAGE:
 * digestDefaultStatics.bucketMinutes;
 * // Returns 15, the window width that yields a readable number of rows over a multi-hour session
 */

export const digestDefaultStatics = {
  bucketMinutes: 15,
  gapFloorSeconds: 120,
  resultFloorBytes: 20_000,
  maxTextChars: 400,
  grepContextChars: 200,
  thinkingExcerptChars: 4_000,
} as const;
